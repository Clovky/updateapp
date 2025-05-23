import { useNavigate } from "react-router-dom";

function Header({ children }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b-2 border-gray-300 p-6 flex items-center justify-between">
      <h1
        className="text-2xl font-bold cursor-pointer"
        onClick={() => navigate("/")}
      >
        UPDATES TRANSPORTS
      </h1>
      {children}
    </header>
  );
}

export default Header;
