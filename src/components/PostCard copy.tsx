export default function PostCard_Copy() {
  return (
    <div className="group mt-30  fixed inset-0 -rotate-z-5 z-50 flex items-center justify-center">
      <article className="group-hover:-rotate-z-10 group-hover:-translate-x-10 transition-transform duration-300 relative box-content p-16 pr-0 rounded-xs w-postcard-width-half h-postcard-height ">
        <div className="w-full h-full relative bg-postcard-background shadow-md">
          <div className="back bg-[url('/assets/logo.png')] bg-no-repeat bg-left bg-cover absolute inset-0 w-full h-full backface-hidden flex items-center justify-center bg-night border-2 border-r-0 border-amber-50 shadow-[3px_0px_0_6px_var(--night)]"></div>
        </div>
      </article>
      <article className="group-hover:rotate-z-10 group-hover:translate-y-20 transition-transform duration-300 relative box-content p-16 pl-0 rounded-xs w-postcard-width-half h-postcard-height ">
        <div className="w-full h-full relative bg-postcard-background shadow-md">
          <div className="back bg-[url('/assets/logo.png')] bg-no-repeat bg-right bg-cover w-full h-full flex bg-night border-2 border-l-0 border-amber-50 shadow-[3px_0px_0_6px_var(--night)]"></div>
        </div>
      </article>
    </div>
  );
}
