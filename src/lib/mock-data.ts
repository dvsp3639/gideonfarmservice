// Mock data for the dashboard. Swap for real API calls once backend is wired.

export type Worker = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  active: boolean;
  createdAt: string;
};

export type Entry = {
  id: string;
  driverName: string;
  vehicleReg: string;
  mobile: string;
  amount: number;
  photoUrl: string;
  workerUsername: string;
  createdAt: string; // ISO
};

// Deterministic "now" so SSR and client render the same strings.
const now = new Date();
now.setHours(12, 0, 0, 0);
function daysAgo(d: number, h = 10, m = 0) {
  const x = new Date(now);
  x.setDate(x.getDate() - d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
}

// Placeholder autorickshaw photo (unsplash)
const photo = (seed: string) =>
  `https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=60&sig=${seed}`;

export const mockWorkers: Worker[] = [
  { id: "w1", username: "ravi.k", fullName: "Ravi Kumar", phone: "+919812340001", active: true, createdAt: daysAgo(45) },
  { id: "w2", username: "sunil.p", fullName: "Sunil Patel", phone: "+919812340002", active: true, createdAt: daysAgo(30) },
  { id: "w3", username: "arjun.s", fullName: "Arjun Singh", phone: "+919812340003", active: false, createdAt: daysAgo(20) },
];

const drivers = [
  { name: "Mahesh Yadav", reg: "MH12AB1234", mob: "+919000000001" },
  { name: "Rakesh Sharma", reg: "MH12CD5678", mob: "+919000000002" },
  { name: "Vikram Rao", reg: "MH14EF9012", mob: "+919000000003" },
  { name: "Suresh Nair", reg: "MH12GH3456", mob: "+919000000004" },
  { name: "Deepak Verma", reg: "MH14IJ7890", mob: "+919000000005" },
  { name: "Anil Joshi", reg: "MH12KL2233", mob: "+919000000006" },
  { name: "Prakash Rane", reg: "MH14MN4455", mob: "+919000000007" },
];

export const mockEntries: Entry[] = Array.from({ length: 60 }).map((_, i) => {
  const d = drivers[i % drivers.length];
  const day = Math.floor(i / 3);
  return {
    id: `e${i + 1}`,
    driverName: d.name,
    vehicleReg: d.reg,
    mobile: d.mob,
    amount: [200, 300, 500, 250, 400, 600, 350][i % 7],
    photoUrl: photo(String(i)),
    workerUsername: mockWorkers[i % 2].username,
    createdAt: daysAgo(day, 8 + (i % 10), (i * 7) % 60),
  };
});

// Aggregate helpers
export function groupByDayVehicle(entries: Entry[]) {
  const map = new Map<string, { day: string; vehicleReg: string; total: number; count: number }>();
  for (const e of entries) {
    const day = e.createdAt.slice(0, 10);
    const key = `${day}__${e.vehicleReg}`;
    const cur = map.get(key) ?? { day, vehicleReg: e.vehicleReg, total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.values()];
}

export function computeCoupons(entries: Entry[]) {
  const grouped = groupByDayVehicle(entries).filter((g) => g.total >= 500);
  // Bonus: 7-day consecutive streak per vehicle
  const byVehicle = new Map<string, string[]>();
  for (const g of grouped) {
    const arr = byVehicle.get(g.vehicleReg) ?? [];
    arr.push(g.day);
    byVehicle.set(g.vehicleReg, arr);
  }
  let bonus = 0;
  const bonusDetails: { vehicleReg: string; awardedOn: string }[] = [];
  for (const [reg, days] of byVehicle) {
    const uniq = [...new Set(days)].sort();
    let streak = 1;
    for (let i = 1; i < uniq.length; i++) {
      const prev = new Date(uniq[i - 1]);
      const cur = new Date(uniq[i]);
      const diff = (cur.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        streak += 1;
        if (streak === 7) {
          bonus += 1;
          bonusDetails.push({ vehicleReg: reg, awardedOn: uniq[i] });
          streak = 0;
        }
      } else {
        streak = 1;
      }
    }
  }
  return { coupons: grouped.length, bonus, couponRows: grouped, bonusDetails };
}

export function last7Days(entries: Entry[]) {
  const today = new Date();
  const days: { date: string; label: string; entries: number; amount: number; coupons: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayEntries = entries.filter((e) => e.createdAt.slice(0, 10) === iso);
    const grouped = groupByDayVehicle(dayEntries).filter((g) => g.total >= 500);
    days.push({
      date: iso,
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      entries: dayEntries.length,
      amount: dayEntries.reduce((s, e) => s + e.amount, 0),
      coupons: grouped.length,
    });
  }
  return days;
}
