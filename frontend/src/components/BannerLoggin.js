import { useNavigate } from "react-router-dom";
import logisticImage from "../assets/logistic.jpg";

function BannerLoggin() {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex justify-center items-center space-x-16 flex-1 bg-cover bg-center"
      style={{ backgroundImage: `url(${logisticImage})` }}
    >
      {/* Overlay pre zníženie viditeľnosti obrázka */}
      <div className="absolute inset-0 bg-white opacity-15 pointer-events-none"></div>
      {/* Tu môžeš pridať ďalší obsah ak chceš */}
    </div>
  );
}

export default BannerLoggin;
