import Image from "next/image.js";
import { imageType } from "@/moves/helperFunctions";

export default function PromotionModal({ open, color, onChoose, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
      <div className="bg-white p-4 rounded-lg min-w-[260px]">
        {/* <Typography color='black' variant="subtitle1" gutterBottom>Promote to:</Typography> */}
        <p className="text-black">Promote to:</p>
        <div className="grid grid-cols-4 gap-3 mt-1 items-center">
          {['Queen', 'Rook', 'Bishop', 'Knight'].map(piece => (
            <button
              key={piece}
              onClick={() => onChoose(piece)}
              className="border-none bg-transparent p-0 cursor-pointer hover:bg-blue-200 rounded-lg"
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
        <div className="mt-2 text-right">
          <button onClick={onCancel} className="text-blue-400 rounded-lg p-2 hover:bg-blue-200 hover:text-blue-600 cursor-pointer">Cancel</button>
        </div>
      </div>
    </div>
  );
}
