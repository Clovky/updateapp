import { useNavigate } from "react-router-dom";
import logisticImage from "../assets/logistic.jpg";

function Banner() {
  const navigate = useNavigate();

  return (
    <div
      className="relative flex justify-center items-center space-x-16 flex-1 bg-cover bg-center"
      style={{ backgroundImage: `url(${logisticImage})` }}
    >
      {/* Overlay pre zníženie viditeľnosti obrázka */}
      <div className="absolute inset-0 bg-white opacity-15 pointer-events-none"></div>
      <button
        className="relative bg-blue-500 text-white w-60 h-20 px-4 py-2 rounded-lg hover:bg-blue-600 text-xl"
        onClick={() => navigate("/actuall")}
      >
        ACTUALL
      </button>
      <button
        className="relative bg-blue-500 text-white w-60 h-20 px-4 py-2 rounded-lg hover:bg-blue-600 text-xl"
        onClick={() => navigate("/history")}
      >
        HISTORY
      </button>
    </div>
  );
}

export default Banner;
