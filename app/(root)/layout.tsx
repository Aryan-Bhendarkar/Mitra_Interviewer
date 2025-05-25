import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="root-layout">      <nav>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/mitra-ai-logo-bright.svg?v=3" alt="Mitra AI Logo" width={32} height={32} />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
            Mitra AI
          </h2>
        </Link>
      </nav>

      {children}
    </div>
  );
};

export default Layout;
