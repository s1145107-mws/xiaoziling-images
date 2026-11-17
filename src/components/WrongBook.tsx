import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Grade, WrongBookEntry } from '../types';
import { exportWrongBook, sortWrongBook } from '../lib/exportExcel';
import { clearWrongBook } from '../lib/storage';
import { audio } from '../audio/AudioEngine';

interface Props {
  entries: WrongBookEntry[];
  onClose: () => void;
  onCleared: () => void;
}

const GRADE_COLOR: Record<Grade, string> = { 小一: 'bg-lime-200', 小二: 'bg-purple-200', 小三: 'bg-sky-200' };

export default function WrongBook({ entries, onClose, onCleared }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const rows = sortWrongBook(entries);

  const doExport = () => {
    audio.click();
    try {
      const name = exportWrongBook(rows);
      setMsg(`已下載：${name}`);
    } catch {
      setMsg('匯出失敗，請再試一次。');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="panel flex max-h-[94vh] w-full max-w-5xl flex-col p-4"
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-3xl font-black">📖 錯字圖鑑</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-green px-4 py-2 text-lg" disabled={!rows.length} onClick={doExport}>
              📥 匯出 Excel
            </button>
            <button type="button" className="btn btn-white px-4 py-2 text-lg" disabled={!rows.length} onClick={() => setConfirmClear(true)}>
              🗑️ 清空
            </button>
            <button type="button" className="btn btn-pink px-4 py-2 text-lg" onClick={onClose}>
              ✖ 關閉
            </button>
          </div>
        </div>
        {msg && <p className="mb-2 rounded-xl bg-lime-100 px-3 py-1 font-bold">{msg}</p>}
        {confirmClear && (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border-4 border-red-300 bg-red-50 px-3 py-2 font-bold">
            確定要清空所有錯字紀錄嗎？清空後無法復原。
            <button
              type="button"
              className="btn btn-pink px-3 py-1 text-base"
              onClick={() => {
                clearWrongBook();
                setConfirmClear(false);
                onCleared();
              }}
            >
              確定清空
            </button>
            <button type="button" className="btn btn-white px-3 py-1 text-base" onClick={() => setConfirmClear(false)}>
              取消
            </button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
            <span className="text-6xl">🌈</span>
            <p className="text-xl font-black">圖鑑還是空的！</p>
            <p className="font-bold text-ink/60">首次答錯或超時的字詞，會自動收錄在這裡。</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-2xl border-4 border-ink bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="sticky top-0 bg-yellow-300">
                <tr>
                  {['年級', '錯字類型', '正字', '字源提示', '關鍵筆畫', '答錯次數'].map((h) => (
                    <th key={h} className="border-b-4 border-ink px-3 py-2 font-black">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.key} className="border-b-2 border-amber-100 align-top odd:bg-amber-50/50">
                    <td className="px-3 py-2">
                      <span className={`rounded-full border-2 border-ink px-2 font-black ${GRADE_COLOR[e.grade]}`}>{e.grade}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-bold">{e.errorType}</td>
                    <td className="kai whitespace-nowrap px-3 py-2 text-3xl font-bold text-blue-800">{e.word}</td>
                    <td className="kai px-3 py-2 text-lg">{e.hint}</td>
                    <td className="kai px-3 py-2 text-lg">{e.keyStroke}</td>
                    <td className="px-3 py-2 text-center font-black text-red-500">× {e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
