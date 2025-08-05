import Button from "@mui/material/Button";
import { Typography } from "@mui/material";
import Image from "next/image.js";
import { imageType } from "@/moves/helperFunctions";

export default function PromotionModal({ open, color, onChoose, onCancel }) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 260 }}>
        <Typography color='black' variant="subtitle1" gutterBottom>Promote to:</Typography>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'center' }}>
          {['Queen', 'Rook', 'Bishop', 'Knight'].map(piece => (
            <button
              key={piece}
              onClick={() => onChoose(piece)}
              style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
              aria-label={`Promote to ${piece}`}
              title={piece}
            >
              <Image
                width={72}
                height={72}
                alt={piece}
                src={`/images/${imageType(`${color[0]}${piece}`)}.png`}
              />
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button size="small" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
