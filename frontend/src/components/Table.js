import { useState, useEffect, useRef } from "react";

function Table({ history = false }) {
  const [data, setData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({
    orderNumber: "",
    id: "",
    carrier: "",
    loading: "",
    unloading: "",
    location: "",
    status: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState({});
  const statusOptions = [
    "Na nakládke",
    "Naložené",
    "Na ceste",
    "Na vykládke",
    "Vyložené",
  ];
  const tableRef = useRef(null);

  // Načítanie údajov z backendu podľa history
  useEffect(() => {
    fetch(`http://localhost:3001/api/transports?history=${history}`)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Chyba pri načítaní údajov:", error));
  }, [history]);

  const handleSaveRow = async (index) => {
    const updatedRow = data[index];

    try {
      const response = await fetch(
        `http://localhost:3001/api/transports/${updatedRow._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedRow),
        }
      );

      if (!response.ok) {
        throw new Error(`Chyba pri ukladaní údajov: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Úspešne uložené:", result);

      // Aktualizuj údaje v tabuľke
      const updatedData = [...data];
      updatedData[index] = result.updatedTransport;
      setData(updatedData);

      setEditingIndex(null); // Skončiť úpravu

      // Odoslanie e-mailu po úprave
      await sendEmail(result.updatedTransport);
    } catch (error) {
      console.error("Chyba pri ukladaní údajov:", error);
    }
  };

  const handleLocationChange = (index, newLocation) => {
    const updatedData = [...data];
    updatedData[index].location = newLocation;
    setData(updatedData);
  };

  const handleStatusChange = (index, newStatus) => {
    const updatedData = [...data];
    updatedData[index].status = newStatus;
    setData(updatedData);
  };

  const handleAddRow = () => {
    setAddingRow(true); // Nastaviť režim pridávania
  };

  const handleSaveNewRow = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/transports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRow),
      });

      if (!response.ok) {
        throw new Error(`Chyba pri ukladaní údajov: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Úspešne pridané:", result);

      // Pridaj nový riadok do tabuľky
      setData((prevData) => [...prevData, result.savedTransport]);
      setAddingRow(false); // Skončiť režim pridávania
      setNewRow({
        orderNumber: "",
        id: "",
        carrier: "",
        loading: "",
        unloading: "",
        location: "",
        status: "",
      }); // Resetovať nový riadok

      // Odoslanie e-mailu po uložení
      await sendEmail(result.savedTransport);
    } catch (error) {
      console.error("Chyba pri ukladaní údajov:", error);
    }
  };

  const handleNewRowChange = (field, value) => {
    setNewRow((prevRow) => ({
      ...prevRow,
      [field]: value,
    }));
  };

  const sendEmail = async (transport) => {
    try {
      const response = await fetch("http://localhost:3001/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "adk@adklogistic.com",
          subject: `Aktualizácia pre prepravu: ${transport.orderNumber}`,
          text: `Aktuálny stav:\n\n
Číslo objednávky: ${transport.orderNumber}\n
ID: ${transport.id}\n
Dopravca: ${transport.carrier}\n
Nakládka: ${transport.loading}\n
Vykládka: ${transport.unloading}\n
Poloha: ${transport.location}\n
Stav: ${transport.status}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Chyba pri odosielaní e-mailu");
      }

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error("Chyba pri odosielaní e-mailu:", error);
    }
  };

  // Funkcia na upload súboru na backend
  const handleFileUpload = async (rowId, file) => {
    const formData = new FormData();
    formData.append("cmr", file);

    try {
      const response = await fetch(
        `http://localhost:3001/api/upload-cmr/${rowId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Chyba pri nahrávaní súboru");
      }

      const result = await response.json();

      setData((prevData) =>
        prevData.map((row) =>
          row._id === rowId ? { ...row, cmrFile: result.file } : row
        )
      );

      // Po úspešnom uploade pošli e-mail s prílohou
      const row = data.find((r) => r._id === rowId);
      await fetch("http://localhost:3001/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "adk@adklogistic.com",
          subject: `CMR nahrané pre prepravu: ${row.orderNumber}`,
          text: `Preprava bola aktualizovaná.\n\n
Číslo objednávky: ${row.orderNumber}\n
ID: ${row.id}\n
Dopravca: ${row.carrier}\n
Nakládka: ${row.loading}\n
Vykládka: ${row.unloading}\n
Poloha: ${row.location}\n
Stav: ${row.status}\n
CMR je v prílohe tohto e-mailu.
          `,
          attachment: {
            filename: result.file,
            path: `uploads/${result.file}`,
          },
        }),
      });
    } catch (error) {
      alert("Nepodarilo sa nahrať súbor alebo odoslať e-mail.");
      console.error(error);
    }
  };

  // Zrušiť pridávanie novej prepravy po kliknutí mimo tabuľky
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setAddingRow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="px-8 py-8 bg-gray-50 min-h-screen">
      {/* Button na pridanie prepravy */}
      <div className="mb-6 flex justify-end">
        {!addingRow && !history && (
          <button
            className="bg-blue-600 text-white px-8 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            onClick={handleAddRow}
          >
            Pridať prepravu
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-200 to-blue-400 text-gray-800">
              <th className="border-b px-6 py-3 text-left rounded-tl-xl">
                Č. obj.
              </th>
              <th className="border-b px-6 py-3 text-left">ID</th>
              <th className="border-b px-6 py-3 text-left">Dopravca</th>
              <th className="border-b px-6 py-3 text-left">Nakládka</th>
              <th className="border-b px-6 py-3 text-left">Vykládka</th>
              <th className="border-b px-6 py-3 text-left">Poloha</th>
              <th className="border-b px-6 py-3 text-left">Stav</th>
              <th className="border-b px-6 py-3 text-center rounded-tr-xl">
                Akcia
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row._id}
                className={`text-center ${
                  index % 2 === 0 ? "bg-blue-50" : "bg-white"
                } hover:bg-blue-100 transition`}
              >
                <td className="px-4 py-2">{row.orderNumber}</td>
                <td className="px-4 py-2">{row.id}</td>
                <td className="px-4 py-2">{row.carrier}</td>
                <td className="px-4 py-2">{row.loading}</td>
                <td className="px-4 py-2">{row.unloading}</td>
                <td className="px-4 py-2">
                  {editingIndex === index && !history ? (
                    <input
                      type="text"
                      value={row.location}
                      onChange={(e) =>
                        handleLocationChange(index, e.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                    />
                  ) : (
                    row.location
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingIndex === index && !history ? (
                    <select
                      value={row.status}
                      onChange={(e) =>
                        handleStatusChange(index, e.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold">{row.status}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingIndex === index && !history ? (
                    <button
                      onClick={() => handleSaveRow(index)}
                      className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition"
                    >
                      Uložiť
                    </button>
                  ) : row.status === "Vyložené" && !history ? (
                    row.cmrFile ? (
                      <a
                        href={`http://localhost:3001/uploads/${row.cmrFile}`}
                        download={row.cmrFile}
                        className="text-blue-600 font-semibold cursor-pointer"
                      >
                        Stiahnuť CMR
                      </a>
                    ) : (
                      <label className="font-semibold text-blue-600 cursor-pointer flex items-center justify-center">
                        Pridať CMR
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUpload(row._id, file);
                            }
                          }}
                        />
                      </label>
                    )
                  ) : !history ? (
                    <button
                      onClick={() => setEditingIndex(index)}
                      className="bg-gray-400 text-white px-4 py-1 rounded-lg hover:bg-gray-600 transition"
                    >
                      Upraviť
                    </button>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}

            {/* Nové pole na pridanie prepravy */}
            {addingRow && !history && (
              <tr className="text-center bg-blue-50">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Č. obj."
                    value={newRow.orderNumber}
                    onChange={(e) =>
                      handleNewRowChange("orderNumber", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="ID"
                    value={newRow.id}
                    onChange={(e) => handleNewRowChange("id", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Dopravca"
                    value={newRow.carrier}
                    onChange={(e) =>
                      handleNewRowChange("carrier", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Nakládka"
                    value={newRow.loading}
                    onChange={(e) =>
                      handleNewRowChange("loading", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Vykládka"
                    value={newRow.unloading}
                    onChange={(e) =>
                      handleNewRowChange("unloading", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Poloha"
                    value={newRow.location}
                    onChange={(e) =>
                      handleNewRowChange("location", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={newRow.status}
                    onChange={(e) =>
                      handleNewRowChange("status", e.target.value)
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                  >
                    <option value="">Vyber stav</option>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={handleSaveNewRow}
                    className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition"
                  >
                    SAVE
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
