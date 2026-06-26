const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Friendly cartoon dinosaur mascot for Glucosaur app
import mascotImg from "@/assets/images/glucosaur_blood_drop_mascot_1782482847167.jpg";

export default function Glucosaur({ size = 64, className = "" }) {
  return (
    <img
      src={mascotImg}
      alt="Glucosaur"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  );
}