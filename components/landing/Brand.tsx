import Link from "next/link";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 399 399"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M67 0l152 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-162 0 0-48a10 10 0 0 1 10-10z m-57 57l48 0 0 172-48 0a10 10 0 0 1-10-10l0-152a10 10 0 0 1 10-10z m114 57l95 0a10 10 0 0 1 10 10l0 48-105 0a10 10 0 0 1-10-10l0-38a10 10 0 0 1 10-10z m-67 113l105 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-95 0a10 10 0 0 1-10-10l0-48z m168-56l63 0 0 161a10 10 0 0 1-10 10l-53 0 0-171z m69-57l95 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-105 0 0-48a10 10 0 0 1 10-10z m-227 227l162 0 0 48a10 10 0 0 1-10 10l-152 0a10 10 0 0 1-10-10l0-38a10 10 0 0 1 10-10z"
      />
    </svg>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-[10px]">
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#C81E28] text-white">
        <Mark className="h-5 w-5" />
      </span>
      <span className="flex flex-col whitespace-nowrap">
        <span className="text-[17px] font-extrabold tracking-[-0.4px] text-[#16181D] sm:text-[19px]">
          Santosa POS
        </span>
        <span className="text-[9px] font-bold tracking-[0.8px] text-[#7C8290]">
          by Santosa Tech
        </span>
      </span>
    </Link>
  );
}
