export default function SharedPlanLayout({ children }) {
  return (
    <>
      <style>{`#root { overflow: auto !important; height: auto !important; }`}</style>
      {children}
    </>
  );
}
