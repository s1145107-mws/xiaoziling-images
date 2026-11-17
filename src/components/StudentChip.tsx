import { useContext } from 'react';
import { ControlsContext } from './SystemButtons';

/**
 * 頂部狀態欄的「同學：3F01」標籤
 * allowSwitch：顯示小型「切換同學」按鈕（戰鬥中不顯示，避免誤觸中斷戰鬥）
 */
export default function StudentChip({
  allowSwitch = true,
  short = false,
  className = '',
}: {
  allowSwitch?: boolean;
  /** 精簡顯示（只顯示學號），用於較窄的頂部欄 */
  short?: boolean;
  className?: string;
}) {
  const { student, switchStudent } = useContext(ControlsContext);
  if (!student) return null;
  return (
    <div className={`flex shrink-0 items-center gap-1 rounded-2xl border-4 border-ink bg-white py-1 pl-3 pr-1 ${className}`}>
      <span className="whitespace-nowrap text-lg font-black">
        👤 {!short && '同學：'}
        <span className="text-sky-700">{student}</span>
      </span>
      {allowSwitch ? (
        <button
          type="button"
          className="ml-1 whitespace-nowrap rounded-xl border-2 border-ink/40 bg-amber-50 px-2 py-0.5 text-sm font-bold text-ink/80 hover:bg-amber-100"
          onClick={switchStudent}
        >
          🔄 切換同學
        </button>
      ) : (
        <span className="w-2" />
      )}
    </div>
  );
}
