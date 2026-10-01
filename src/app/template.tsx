// O template é recriado a cada navegação, então a animação de entrada roda em toda
// troca de página — o equivalente ao fade entre rotas do App.jsx do React.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagina">{children}</div>;
}
