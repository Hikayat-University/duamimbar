/**
 * Loading UI untuk /my-project — sama seperti /home, otomatis muncul
 * selagi data dashboard sedang di-fetch.
 */
export default function MyProjectLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2E95]">
      <img
        src="/logo-white.png"
        alt="Duamimbar"
        className="h-20 w-auto animate-[breathe_1.6s_ease-in-out_infinite]"
      />
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
