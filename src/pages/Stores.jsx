const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { MapPin, Loader2, RefreshCw, Store, Navigation, Search } from "lucide-react";
import MascotHint from "@/components/MascotHint";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Fix default marker icons for leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const storeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center]);
  return null;
}

export default function Stores({ settings }) {
  const lang = settings.language;
  const isUk = lang === "uk";

  const [position, setPosition] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [searchLocation, setSearchLocation] = useState(null); // {label, lat, lon} or null

  useEffect(() => {
    getLocation();
  }, []);

  function getLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(isUk ? "Геолокація не підтримується вашим браузером." : "Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setGeoError(isUk ? "Не вдалося отримати ваше місцезнаходження." : "Could not get your location.");
      }
    );
  }

  async function searchByCity() {
    if (!cityInput.trim()) return;
    setLoading(true);
    setSearched(true);
    setStores([]);
    // Geocode city name via nominatim
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1`);
    const geoData = await geoRes.json();
    if (!geoData.length) {
      setLoading(false);
      setGeoError(isUk ? "Місто не знайдено. Спробуйте ще раз." : "City not found. Try again.");
      return;
    }
    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);
    setPosition([lat, lon]);
    setSearchLocation({ label: cityInput });
    await doSearch(lat, lon);
  }

  async function searchStores() {
    if (!position) return;
    setLoading(true);
    setSearched(true);
    const [lat, lon] = position;
    const result = await db.integrations.Core.InvokeLLM({
      prompt: isUk
        ? `Знайди 5-8 найближчих магазинів або супермаркетів поблизу координат ${lat}, ${lon} (Україна або найближче місто), де є відділи або товари для діабетиків. Відповідай реальними відомими мережами.`
        : `Find 5-8 nearest stores near coordinates ${lat}, ${lon} with diabetic sections. Use real store chains.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          stores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                lat: { type: "number" },
                lon: { type: "number" },
                type: { type: "string" },
                diabetic_section: { type: "string" },
              }
            }
          }
        }
      }
    });
    setStores(result.stores || []);
    setLoading(false);
  }

  async function doSearch(lat, lon) {
    const result = await db.integrations.Core.InvokeLLM({
      prompt: isUk
        ? `Знайди 5-8 найближчих магазинів або супермаркетів поблизу координат ${lat}, ${lon} (або найближчого міста), де є відділи або товари для діабетиків (діабетичне харчування, цукрозамінники, спеціальне харчування). Для кожного вкажи: назву, адресу, орієнтовні координати (lat, lon), тип магазину, що є для діабетиків. Відповідай реальними відомими мережами магазинів.`
        : `Find 5-8 nearest supermarkets or stores near coordinates ${lat}, ${lon} that have diabetic sections or diabetic-friendly products (diabetic food, sugar substitutes, special nutrition). For each provide: name, address, approximate coordinates (lat, lon), store type, what diabetic products they carry. Use real well-known store chains.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          stores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                lat: { type: "number" },
                lon: { type: "number" },
                type: { type: "string" },
                diabetic_section: { type: "string" },
              }
            }
          }
        }
      }
    });
    setStores(result.stores || []);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <MascotHint
        show={settings.show_mascot !== false}
        lang={lang}
        ukText="🦖 Введи своє місто або дозволь геолокацію — знайду магазини з товарами для діабетиків поруч! 🛝"
        enText="🦖 Enter your city or allow location access — I'll find nearby stores with diabetic-friendly products! 🛝"
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {isUk ? "🏪 Магазини для діабетиків" : "🏪 Diabetic-Friendly Stores"}
        </h1>
        <Button size="sm" variant="outline" onClick={getLocation} className="rounded-xl gap-1.5">
          <Navigation className="w-4 h-4" />
          {isUk ? "Геолокація" : "Locate"}
        </Button>
      </div>

      {/* City manual input */}
      <div className="flex gap-2">
        <Input
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchByCity()}
          placeholder={isUk ? "Введіть місто..." : "Enter city..."}
          className="rounded-xl flex-1"
        />
        <Button onClick={searchByCity} disabled={loading || !cityInput.trim()} className="rounded-xl gap-1.5 shrink-0">
          <Search className="w-4 h-4" />
          {isUk ? "Знайти" : "Search"}
        </Button>
      </div>

      {geoError && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{geoError}</div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border/50 h-64">
        {position ? (
          <MapContainer center={position} zoom={14} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={position} />
            <Marker position={position} icon={userIcon}>
              <Popup>{isUk ? "Ви тут" : "You are here"}</Popup>
            </Marker>
            {stores.map((s, i) => (
              s.lat && s.lon ? (
                <Marker key={i} position={[s.lat, s.lon]} icon={storeIcon}>
                  <Popup>
                    <strong>{s.name}</strong><br />
                    {s.address}<br />
                    <span className="text-xs text-green-700">{s.diabetic_section}</span>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-muted/30 gap-2">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isUk ? "Очікуємо геолокацію..." : "Waiting for location..."}
            </p>
          </div>
        )}
      </div>

      {/* Search button */}
      {position && !searched && (
        <Button onClick={searchStores} className="w-full rounded-xl gap-2">
          <Store className="w-4 h-4" />
          {isUk ? "Знайти магазини поблизу" : "Find Nearby Stores"}
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{isUk ? "Шукаємо магазини..." : "Searching stores..."}</span>
        </div>
      )}

      {/* Store List */}
      {!loading && stores.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {isUk ? `Знайдено магазинів: ${stores.length}` : `Found ${stores.length} stores`}
            </h2>
            <button onClick={searchStores} className="flex items-center gap-1 text-xs text-primary">
              <RefreshCw className="w-3 h-3" /> {isUk ? "Оновити" : "Refresh"}
            </button>
          </div>
          {stores.map((store, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 p-4 space-y-1.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{store.name}</p>
                  <p className="text-xs text-muted-foreground">{store.address}</p>
                  {store.type && <p className="text-xs text-muted-foreground mt-0.5">{store.type}</p>}
                </div>
              </div>
              {store.diabetic_section && (
                <div className="ml-12 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-green-700 dark:text-green-400">
                    🩺 {store.diabetic_section}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && searched && stores.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          {isUk ? "Магазини не знайдено. Спробуйте ще раз." : "No stores found. Try again."}
        </div>
      )}
    </div>
  );
}