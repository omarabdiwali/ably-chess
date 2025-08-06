import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { getAblyClient } from '../ablyClient';

const AblyContext = createContext(null);

async function logServer(message) {
  try {
    await fetch('/api/logging', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[AblyProvider] ${message}` }),
      keepalive: true,
    });
  } catch {}
}

export function AblyProvider({ children }) {
  const clientRef = useRef(null);
  const channelMapRef = useRef(new Map());
  const presenceInfoRef = useRef({ joined: false, computer: false, room: '', color: '' });
  const disconnectHandledRef = useRef(false);

  const ensureClient = useCallback(async () => {
    let client = clientRef.current;
    if (!client) {
      client = getAblyClient();
      clientRef.current = client;
      // logServer('roomCreated Ably client');
    }
    if (client.connection.state === 'connected') return client;
    if (client.connection.state !== 'connecting') {
      try { client.connect(); /* logServer('roomInitiated Ably connect()'); */ } catch {}
    }
    await new Promise((resolve, reject) => {
      const on = (s) => {
        if (s.current === 'connected') { client.connection.off(on); /* logServer('roomAbly connected'); */ resolve(); }
        if (s.current === 'failed' || s.current === 'closed') { client.connection.off(on); /* logServer(`roomAbly connection ${s.current}`); */ reject(s.reason || new Error('Ably connection failed/closed')); }
      };
      client.connection.on(on);
      Promise.resolve().then(() => {
        if (client.connection.state === 'connected') { client.connection.off(on); resolve(); }
      });
    });
    return client;
  }, []);

  const ensureAttached = useCallback(async (channel) => {
    if (!channel) return;
    if (channel.state === 'attached') return;

    const waitFor = (ok, bad, reason, timeoutMs = 8000) => new Promise((resolve, reject) => {
      let settled = false;
      const listener = (s) => {
        if (settled) return;
        if (ok.includes(s.current)) { settled = true; try { channel.off(listener); } catch {} /* logServer(`roomChannel ${channel.name} attached`); */ resolve(); }
        if (bad.includes(s.current)) { settled = true; try { channel.off(listener); } catch {} /* logServer(`roomChannel ${channel.name} attach failed: ${s.current}`); */ reject(s.reason || new Error(reason)); }
      };
      channel.on(listener);

      const t = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { channel.off(listener); } catch {}
        // logServer(`roomChannel ${channel.name} attach timeout`);
        reject(new Error(`${reason} timed out after ${timeoutMs}ms (state=${channel.state})`));
      }, timeoutMs);

      Promise.resolve().then(() => {
        if (settled) return;
        if (ok.includes(channel.state)) {
          settled = true; clearTimeout(t); try { channel.off(listener); } catch {} /* logServer(`roomChannel ${channel.name} already attached`); */ resolve();
        } else if (bad.includes(channel.state)) {
          settled = true; clearTimeout(t); try { channel.off(listener); } catch {} /* logServer(`roomChannel ${channel.name} in bad state: ${channel.state}`); */ reject(new Error(reason));
        }
      });
    });

    const client = channel.client;
    if (client.connection.state !== 'connected') {
      if (client.connection.state !== 'connecting') {
        try { client.connect(); /* logServer('roomReconnect before attach'); */ } catch {}
      }
      await new Promise((resolve, reject) => {
        const listener = (s) => {
          if (s.current === 'connected') { client.connection.off(listener); /* logServer('roomReconnected'); */ resolve(); }
          if (s.current === 'failed' || s.current === 'closed') {
            client.connection.off(listener); /* logServer(`roomReconnect ${s.current}`); */ reject(s.reason || new Error('Ably connection failed/closed'));
          }
        };
        client.connection.on(listener);
        Promise.resolve().then(() => {
          if (client.connection.state === 'connected') { client.connection.off(listener); resolve(); }
          else if (client.connection.state === 'failed' || client.connection.state === 'closed') {
            client.connection.off(listener); reject(new Error('Ably connection failed/closed'));
          }
        });
      });
    }

    if (channel.state === 'attaching') {
      // logServer(`roomWaiting for channel ${channel.name} to attach (attaching)`);
      await waitFor(['attached'], ['failed', 'suspended', 'detached'], 'Attach failed (attaching)');
      return;
    }
    if (['initialized', 'detached', 'suspended'].includes(channel.state)) {
      try { await channel.attach(); /* logServer(`roomCalled attach() on ${channel.name}`); */ } catch {}
      await waitFor(['attached'], ['failed', 'suspended', 'detached'], 'Attach failed (after attach)');
      return;
    }
    try { await channel.attach(); /* logServer(`roomCalled attach() (post connect) on ${channel.name}`); */ } catch {}
    await waitFor(['attached'], ['failed', 'suspended', 'detached'], 'Attach failed (post connect)');
  }, []);

  const getChannel = useCallback(async (room) => {
    if (!room) return null;
    const key = `chess:${room}`;
    if (channelMapRef.current.has(key)) return channelMapRef.current.get(key);
    const client = await ensureClient();
    const ch = client.channels.get(key);
    channelMapRef.current.set(key, ch);
    // logServer(`roomGot channel ${key}`);
    return ch;
  }, [ensureClient]);

  const safePublish = useCallback(async (room, name, data) => {
    const ch = await getChannel(room);
    if (!ch) return;
    await ensureAttached(ch);
    // logServer(`roomPublishing "${name}" to ${ch.name}`);
    return ch.publish(name, data);
  }, [getChannel, ensureAttached]);

  const presenceEnter = useCallback(async ({ room, color }) => {
    const ch = await getChannel(room);
    if (!ch) return;
    await ensureAttached(ch);
    await ch.presence.enter({ color }).catch(() => {});
    presenceInfoRef.current = { ...presenceInfoRef.current, room, color, joined: true };
    // logServer(`roomPresence enter room=${room} color=${color}`);
  }, [getChannel, ensureAttached]);

  const presenceLeave = useCallback(async () => {
    const { room, color } = presenceInfoRef.current;
    if (!room) return;
    const ch = await getChannel(room);
    if (!ch) return;
    try {
      if (ch.state === 'attached' || ch.state === 'attaching') {
        await ch.presence.leave({ color }).catch(() => {});
        // logServer(`roomPresence leave room=${room} color=${color}`);
      }
    } catch (e) {
        logServer
    }
  }, [getChannel]);

  const setPresenceMeta = useCallback((meta) => {
    presenceInfoRef.current = { ...presenceInfoRef.current, ...meta };
    // logServer(`roomUpdated presence meta: ${JSON.stringify(meta)}`);
  }, []);

  // Automatic disconnection handling and cleanup
  useEffect(() => {
    const beforeUnload = async () => {
      if (disconnectHandledRef.current) return;
      const { joined, computer, room, color } = presenceInfoRef.current;
      if (!joined || computer || !room || !color) return;

      disconnectHandledRef.current = true;

      try {
        // Best-effort Ably publish 'delete' to the room
        const ch = await getChannel(room);
        if (ch) {
          try {
            await ensureAttached(ch);
            const payload = { room, color, at: Date.now() };
            await ch.publish('delete', payload);
            // logServer(`roomPublished "delete" to ${ch.name} payload=${JSON.stringify(payload)}`);
          } catch (e) {
            logServer(`roomFailed to publish "delete" to room=${room}: ${e?.message || e}`);
          }
        }
      } catch (e) {
        logServer(`roomError preparing publish on beforeunload: ${e?.message || e}`);
      }

      // Notify your server too (existing behavior)
      try {
        const payload = JSON.stringify({
          code: room,
          color: color && color[0] ? color[0].toUpperCase() + color.slice(1) : color
        });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/delete', blob);
          // logServer(`roomsendBeacon /api/delete payload=${payload}`);
        } else {
          fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
          // logServer(`roomfetch /api/delete payload=${payload}`);
        }
      } catch {
        logServer('roomError sending /api/delete on beforeunload');
      }

      try {
        await presenceLeave();
      } catch {}
    };

    window.addEventListener('beforeunload', beforeUnload);
    // logServer('roomAdded beforeunload listener');

    return () => {
      try { window.removeEventListener('beforeunload', beforeUnload); } catch {}
      // logServer('roomRemoved beforeunload listener');
    };
  }, [getChannel, ensureAttached, presenceLeave]);

  const value = useMemo(() => ({
    getChannel,
    ensureClient,
    ensureAttached,
    safePublish,
    presenceEnter,
    presenceLeave,
    setPresenceMeta,
  }), [getChannel, ensureClient, ensureAttached, safePublish, presenceEnter, presenceLeave, setPresenceMeta]);

  return (
    <AblyContext.Provider value={value}>
      {children}
    </AblyContext.Provider>
  );
}

export function useAbly() {
  const ctx = useContext(AblyContext);
  if (!ctx) throw new Error('useAbly must be used within AblyProvider');
  return ctx;
}
