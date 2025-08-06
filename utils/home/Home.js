import { useCallback, useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import ComputerBoard from '../computer/ComputerBoard';
import Board from '../board/Board';
import styles from './Home.module.css';
import { fenString } from '@/moves/helperFunctions';
import { useAbly } from '../ably/AblyProvider';

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
  const [info, setInfo] = useState('Status: Active');
  const [startState, setStartState] = useState('end'); // "play" | "end"

  const { enqueueSnackbar } = useSnackbar();

  // Ably from provider
  const { ensureClient, getChannel, ensureAttached, safePublish, presenceEnter, presenceLeave, setPresenceMeta } = useAbly();

  // Helpers -----------------------------------------------------------------------------

  const normalizeCode = (txt) => (txt || '').replace(/\s+/g, '');

  const onChangeRoomCode = (e) => {
    e.preventDefault();
    setRoom(normalizeCode(e.target.value));
  };

  const randomCode6 = () => Math.floor(100000 + Math.random() * 900000).toString();

  // When page state changes, inform provider for disconnect handling
  useEffect(() => {
    setPresenceMeta({ joined, computer, room, color });
  }, [joined, computer, room, color, setPresenceMeta]);

  // Public join/create/enter logic -------------------------------------------------------

  const joinRoom = useCallback(async (e) => {
    e.preventDefault();

    const code = normalizeCode(room);
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      enqueueSnackbar('Invalid Code', { autoHideDuration: 2500, variant: 'error' });
      return;
    }

    setDisabled(true);
    setLoading(true);

    try {
      const resp = await fetch('/api/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await resp.json();

      if (data && data.response === 'Joined the room!') {
        const assignedColor = data.color.toLowerCase();
        setColor(assignedColor);
        setPosition(data.position);
        setTurn(data.turn);
        setStartState('play');
        setInfo('Status: Active');

        await ensureClient();
        const ch = await getChannel(code);
        await ensureAttached(ch);
        await presenceEnter({ room: code, color: assignedColor });

        try { await safePublish(code, 'start', { by: assignedColor }); } catch {}
        setJoined(true);
        enqueueSnackbar('Joined the room!', { autoHideDuration: 2500, variant: 'success' });
      } else {
        enqueueSnackbar(data?.response || 'Unable to join room', { autoHideDuration: 2500, variant: 'error' });
      }
    } catch {
      enqueueSnackbar('Network error joining room.', { autoHideDuration: 2500, variant: 'error' });
    } finally {
      setLoading(false);
      setDisabled(false);
    }
  }, [room, enqueueSnackbar, ensureClient, ensureAttached, presenceEnter, safePublish, getChannel]);

  const createRoom = useCallback(async (e, isPublic = false) => {
    e.preventDefault();
    if (loading) return;

    setDisabled(true);
    setLoading(true);

    const code = randomCode6();

    try {
      const resp = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isPublic, position })
      });
      const data = await resp.json();

      if (data && data.response === 'Room has been created.') {
        const assignedColor = data.color.toLowerCase();
        setRoom(data.code);
        setColor(assignedColor);
        setTurn('white');
        setInfo('Status: Waiting for player...');
        setStartState('end');

        await ensureClient();
        const ch = await getChannel(data.code);
        await ensureAttached(ch);
        await presenceEnter({ room: data.code, color: assignedColor });

        if (!data.created) {
          setStartState('play');
          setInfo('Status: Active')
          try { await safePublish(data.code, 'start', { by: assignedColor }); } catch {}
          enqueueSnackbar('Joined the room!', { autoHideDuration: 2500, variant: 'success' });
        } else {
          try { await safePublish(data.code, 'info', { type: 'host-waiting', color: assignedColor }); } catch {}
          enqueueSnackbar('Room created!', { autoHideDuration: 2500, variant: 'success' });
        }

        setJoined(true);
      } else {
        enqueueSnackbar('Error creating a room!', { autoHideDuration: 2500, variant: 'error' });
      }
    } catch {
      enqueueSnackbar('Network error creating room.', { autoHideDuration: 2500, variant: 'error' });
    } finally {
      setLoading(false);
      setDisabled(false);
    }
  }, [loading, position, enqueueSnackbar, ensureClient, ensureAttached, presenceEnter, safePublish, getChannel]);

  // If the user navigates away from Home without ever mounting Board, silently leave presence best-effort
  useEffect(() => {
    return () => {
      const leave = async () => {
        try { await presenceLeave(); } catch {}
      };
      leave();
    };
  }, [presenceLeave]);

  // Computer mode
  const startComputerMode = () => {
    setComputer(true);
    setJoined(true);
    setStartState('play');
    setColor('white'); // default
  };

  // Render ------------------------------------------------------------------------------
  return (
    <div>
      {!joined ? (
        <center>
          <Card className={styles.card} variant="outlined">
            <CardContent>
              {!loading ? (
                <div>
                  <Typography className={styles.room} style={{ margin: '4%' }} variant="h5" component="h2" gutterBottom>
                    Room code
                  </Typography>
                  <form onSubmit={joinRoom}>
                    <TextField
                      disabled={disabled}
                      autoFocus
                      style={{ marginTop: '10%' }}
                      variant="outlined"
                      size="small"
                      id="input"
                      value={room}
                      onChange={onChangeRoomCode}
                    />
                    <Button
                      disabled={disabled}
                      style={{ marginLeft: '4%', marginTop: '10.5%' }}
                      variant="contained"
                      color="primary"
                      id="join"
                      onClick={joinRoom}
                    >
                      Join
                    </Button>
                  </form>
                  <Button
                    disabled={disabled}
                    style={{ marginTop: '7%' }}
                    color="primary"
                    id="create"
                    onClick={(e) => createRoom(e, false)}
                  >
                    Create Room
                  </Button>
                  <Button
                    disabled={disabled}
                    style={{ marginTop: '7%' }}
                    onClick={(e) => createRoom(e, true)}
                  >
                    Public Play
                  </Button>
                  <Typography style={{ marginTop: '4%' }}>
                    Play with computer:
                    <Button disabled={disabled} onClick={startComputerMode}>
                      Play
                    </Button>
                  </Typography>
                </div>
              ) : (
                <center>
                  <CircularProgress />
                </center>
              )}
            </CardContent>
          </Card>
        </center>
      ) : (
        <div className={styles.App}>
          {!computer ? (
            <Board
              room={room}
              color={color}
              start={startState}
              position={position}
              beginning={turn}
              info={info}
            />
          ) : !engine ? (
            <center>
              <Card className={styles.card} variant="outlined">
                <CardContent>
                  <div>
                    <Typography className={styles.room} style={{ margin: '4%' }} variant="h5" component="h2" gutterBottom>
                      Select Chess Engine
                    </Typography>
                    <Button style={{ marginTop: '7%' }} color="primary" onClick={() => setEngine('custom')}>
                      Custom Engine (easy)
                    </Button>
                    <br />
                    <Button style={{ marginTop: '7%' }} color="primary" onClick={() => setEngine('stockfish')}>
                      Stockfish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </center>
          ) : (
            <ComputerBoard engine={engine} position={position} />
          )}
        </div>
      )}
    </div>
  );
}