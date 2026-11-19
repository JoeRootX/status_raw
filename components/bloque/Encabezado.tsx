import Pestanas from './Pestanas';
import Reloj from './Reloj';

export default function Encabezado() {
  return (
    <header className="top">
      <div>
        <div className="brand">&gt; joerootX_</div>
        <Pestanas />
      </div>
      <Reloj />
    </header>
  );
}
