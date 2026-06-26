const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useRef } from "react";

export default function useReminders() {
  const lastFiredRef = useRef({});

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const check = async () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const currentDay = now.getDay();

      const reminders = await db.entities.Reminder.filter({ active: true });

      for (const reminder of reminders) {
        if (
          reminder.time === currentTime &&
          reminder.days?.includes(currentDay)
        ) {
          const key = `${reminder.id}-${currentTime}-${now.toDateString()}`;
          if (!lastFiredRef.current[key]) {
            lastFiredRef.current[key] = true;
            const bodyText = reminder.type === "glucose"
                ? "Час виміряти рівень цукру 🩸 | Time to check your glucose 🩸"
                : reminder.type === "medication"
                ? "Час прийняти ліки 💊 | Time to take your medication 💊"
                : "Нагадування GlucoVita | GlucoVita Reminder";
            new Notification(reminder.title, {
              body: bodyText,
              icon: "/favicon.ico",
            });
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);
}