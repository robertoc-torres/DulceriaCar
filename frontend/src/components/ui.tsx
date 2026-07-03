import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  backTo?: string;
}

export function PageHeader({ title, backTo }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
      {backTo ? (
        <Link href={backTo} className="w-10 h-10 flex items-center justify-center -ml-2">
          <ArrowLeft size={22} />
        </Link>
      ) : (
        <div className="w-10" />
      )}
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="w-10" />
    </header>
  );
}

export function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 mb-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-primary" : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-gray-500 text-sm">Cargando…</div>
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="p-6 text-center">
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
}
