export default function PostCard() {
  return (
    <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-text/30">
      <article className="rounded-xs w-postcard-width h-postcard-height bg-postcard-background shadow-md bg-[url('/assets/frame.svg')] bg-no-repeat bg-center p-32"></article>
    </div>
  );
}
