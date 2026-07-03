import { Link } from "wouter";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-2">404</p>
      <p className="text-gray-500 mb-6">Página no encontrada</p>
      <Link href="/" className="btn-primary px-6">
        Volver al inicio
      </Link>
    </div>
  );
}
