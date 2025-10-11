import { useCallback, useEffect, useState } from 'react';
import { useAbly } from '@/utils/ably/AblyProvider';
import { useSnackbar } from 'notistack'; // Actual Snackbar import
import Board from './Board';
import ComputerBoard from './ComputerBoard';
import { fenString } from '@/moves/helperFunctions';

// --- Main HomePage Component ---

// Default initial chess position
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

export default function HomePage() {
  // Basic UI states
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [joined, setJoined] = useState(false);
  const [computer, setComputer] = useState(false);
  const [engine, setEngine] = useState(null);

  // Match metadata
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(''); // "white" or "black"
  const [turn, setTurn] = useState('white'); // starting turn
  const [position, setPosition] = useState(() => fenString(DEFAULT_FEN));
  const [info, setInfo] = useState('Status: White Turn');
  const [startState, setStartState] = useState('end'); // "play" | "end"

  const { enqueueSnackbar } = useSnackbar();
  const { ensureClient, getChannel, ensureAttached, safePublish, presenceEnter, presenceLeave, setPresenceMeta } = useAbly();

  // --- Helper Functions ---
  const normalizeCode = (txt) => (txt || '').replace(/\s+/g, '').toUpperCase();
  const capitalize = (s, fallback = '') => s ? s.charAt(0).toUpperCase() + s.slice(1) : fallback;

  const onChangeRoomCode = (e) => {
    e.preventDefault();
    setRoom(normalizeCode(e.target.value));
  };
  
  // --- Standard API Call Function ---
  const apiCall = (url, body) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  // When page state changes, inform provider for disconnect handling
  useEffect(() => {
    setPresenceMeta({ joined, computer, room, color });
  }, [joined, computer, room, color, setPresenceMeta]);

  // --- Core Game Logic (Join, Create) ---
  const joinRoom = useCallback(async (e) => {
    e.preventDefault();
    const code = normalizeCode(room);
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      enqueueSnackbar('Invalid Code. Code must be 6 digits.', { variant: 'error' });
      return;
    }
    setDisabled(true); setLoading(true);
    try {
      const resp = await apiCall('/api/active', { code });
      const data = await resp.json();
      
      if (resp.ok && data?.response === 'Joined the room!') {
        setColor(data.color.toLowerCase());
        setPosition(data.position);
        setTurn(data.turn);
        setStartState('play');
        setInfo(`Status: ${capitalize(data.turn, 'Active')} Turn`);
        
        await ensureClient();
        const ch = await getChannel(code);
        await ensureAttached(ch);
        await presenceEnter({ room: code, color: data.color.toLowerCase() });
        await safePublish(code, 'start', { by: data.color.toLowerCase(), turn: data.turn });
        
        setJoined(true);
        enqueueSnackbar('Joined the room!', { variant: 'success' });
      } else {
        enqueueSnackbar(data?.response || 'Unable to join room', { variant: 'error' });
      }
    } catch {
      enqueueSnackbar('Network error joining room.', { variant: 'error' });
    } finally {
      setLoading(false); setDisabled(false);
    }
  }, [room, enqueueSnackbar, ensureClient, getChannel, ensureAttached, presenceEnter, safePublish]);

  const createRoom = useCallback(async (e, isPublic = false) => {
    e.preventDefault();
    if (loading) return;
    setDisabled(true); setLoading(true);
    try {
      const resp = await apiCall('/api/create', { isPublic, position });
      const data = await resp.json();
      
      if (resp.ok && data?.response === 'Room has been created.') {
        setColor(data.color.toLowerCase());
        setRoom(data.code);
        setTurn('white');
        setStartState(data.created ? 'end' : 'play');
        setInfo(data.created ? 'Status: Waiting for player...' : 'Status: White Turn');
        
        await ensureClient();
        const ch = await getChannel(data.code);
        await ensureAttached(ch);
        await presenceEnter({ room: data.code, color: data.color.toLowerCase() });
        
        if (!data.created) {
          await safePublish(data.code, 'start', { by: data.color.toLowerCase(), turn: 'white' });
          enqueueSnackbar('Joined a public room!', { variant: 'success' });
        } else {
          await safePublish(data.code, 'info', { type: 'host-waiting', color: data.color.toLowerCase() });
          enqueueSnackbar('Room created!', { variant: 'success' });
        }
        
        setJoined(true);
      } else {
        enqueueSnackbar('Error creating a room!', { variant: 'error' });
      }
    } catch {
      enqueueSnackbar('Network error creating room.', { variant: 'error' });
    } finally {
      setLoading(false); setDisabled(false);
    }
  }, [loading, position, enqueueSnackbar, ensureClient, getChannel, ensureAttached, presenceEnter, safePublish]);

  useEffect(() => {
    return () => {
      const leave = async () => { try { await presenceLeave(); } catch { } };
      if (joined) leave();
    };
  }, [presenceLeave, joined]);

  const startComputerMode = () => {
    setComputer(true);
    setJoined(true);
    setStartState('play');
    setColor('white');
  };

  const reverseComputerMode = () => {
    setComputer(false);
    setJoined(false);
    setStartState('end');
    setColor('');
  }

  const CreateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
  const ComputerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M8 16h.01" /><path d="M12 16h.01" /><path d="M16 16h.01" /></svg>;
  const JoinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>;
  const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
  const Spinner = () => <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

  const renderHome = () => (
    <div className="relative w-full max-w-md bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-fade-in-up">
      {loading && (
        <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center rounded-2xl z-10">
          <Spinner />
        </div>
      )}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tighter text-white">AblyChess</h1>
        <p className="text-gray-400 mt-2">Play with friends or challenge the machine.</p>
      </div>

      {/* Join with Code */}
      <div className="space-y-3">
        <label htmlFor="room-code" className="text-sm font-medium text-gray-300">Join a Private Game</label>
        <form onSubmit={joinRoom} className="flex mt-1 space-x-2">
          <input
            id="room-code"
            type="text"
            placeholder="ENTER CODE"
            maxLength="6"
            value={room}
            onChange={onChangeRoomCode}
            disabled={disabled}
            className="flex-grow bg-gray-900 text-white placeholder-gray-500 tracking-widest text-center font-mono rounded-md py-3 px-4 border border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
          />
          <button type="submit" disabled={disabled || room.length < 6} className="cursor-pointer bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded-md transition-all duration-300 flex items-center justify-center">
            <JoinIcon />
          </button>
        </form>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
        <div className="relative bg-gray-800 px-2 text-xs text-gray-500">OR</div>
      </div>

      {/* Create New Game / Play Computer */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={(e) => createRoom(e, false)} disabled={disabled} className="cursor-pointer group flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
            <CreateIcon />
            <span>Private Room</span>
          </button>
          <button onClick={(e) => createRoom(e, true)} disabled={disabled} className="cursor-pointer group flex items-center justify-center gap-3 w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
            <GlobeIcon />
            <span>Public Play</span>
          </button>
        </div>
        <button onClick={startComputerMode} disabled={disabled} className="cursor-pointer group flex items-center justify-center gap-3 w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
          <ComputerIcon />
          <span>vs. Computer</span>
        </button>
      </div>
    </div>
  );

  const renderEngineSelect = () => (
    <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6 text-center animate-fade-in">
      <div className='flex'>
        <button onClick={reverseComputerMode} className='text-white hover:bg-gray-500 cursor-pointer bg-gray-600 py-3 px-3 rounded-md'><JoinIcon /></button>
        <h2 className="flex-1 text-3xl font-bold text-white">Choose Opponent</h2>
      </div>
      
      <p className="text-gray-400">Select the engine you want to play against.</p>
      <div className="flex flex-col space-y-4 pt-4">
        <button onClick={() => setEngine('custom')} className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
          Custom Engine (Easy)
        </button>
        <button onClick={() => setEngine('stockfish')} className="cursor-pointer bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-md transition-all duration-300">
          Stockfish (Hard)
        </button>
      </div>
    </div>
  );

  const renderGame = () => {
    if (!computer) {
      return (
        <center className='text-white'>
            <Board room={room} color={color} start={startState} position={position} beginning={turn} info={info} />
        </center>
      )
    }
    if (!engine) {
      return renderEngineSelect();
    }
    return (
        <center className='text-white'>
            <ComputerBoard engine={engine} position={position} />
        </center>
    )
  };

  return (
    <>
    {!joined ? (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4 font-sans selection:bg-green-500/30">
            <div className="fixed inset-0 opacity-20"></div>
            {renderHome()}
        </div>
    ) : (<div className='bg-gray-900 min-h-screen flex items-center justify-center'>{renderGame()}</div>)}
    </>
  );
}