export type MaintenanceStatus = "Einsatzbereit" | "In Werkstatt" | "TÜV fällig";

export type VehicleRecord = {
  plate: string;
  type: string;
  year: number;
  mileage: number;
  nextService: string;
  nextTuv: string;
  maintenanceStatus: MaintenanceStatus;
  /** Name of the driver currently logged into this vehicle, or null if no one is. */
  activeDriver: string | null;
  /** ISO timestamp of when the current driver logged in, or null. */
  activeSince: string | null;
};

export type OrderStatus = "Neu" | "Disponiert" | "Unterwegs" | "Zugestellt";

export type OrderMessage = { id: string; from: "driver" | "dispo"; authorName: string; text: string; at: string };

export type OrderRecord = {
  id: string;
  customer: string;
  pickup: string;
  delivery: string;
  date: string;
  notes: string;
  status: OrderStatus;
  driverName: string | null;
  vehiclePlate: string | null;
  createdAt: string;
  messages: OrderMessage[];
};

export const driverRoster = [
  "Lukas Schmidt",
  "Piotr Nowak",
  "Timo Fischer",
  "Anja Krüger",
  "Rafael Lindt",
] as const;

export const initialVehicles: VehicleRecord[] = [
  { plate: "SN-BF 101", type: "Sattelzugmaschine Euro 6", year: 2024, mileage: 128450, nextService: "2026-10-02", nextTuv: "2027-03-15", maintenanceStatus: "Einsatzbereit", activeDriver: null, activeSince: null },
  { plate: "SN-BF 102", type: "Sattelzugmaschine Euro 6", year: 2023, mileage: 189320, nextService: "2026-09-18", nextTuv: "2026-11-30", maintenanceStatus: "Einsatzbereit", activeDriver: null, activeSince: null },
  { plate: "SN-BF 104", type: "Sattelzugmaschine Euro 6E", year: 2025, mileage: 42110, nextService: "2027-01-20", nextTuv: "2027-06-10", maintenanceStatus: "Einsatzbereit", activeDriver: null, activeSince: null },
  { plate: "SN-BF 112", type: "Kühlauflieger Multi-Temp", year: 2022, mileage: 210870, nextService: "2026-09-10", nextTuv: "2026-09-25", maintenanceStatus: "TÜV fällig", activeDriver: null, activeSince: null },
  { plate: "SN-BF 118", type: "Standard-Sattelauflieger", year: 2021, mileage: 265400, nextService: "2026-09-05", nextTuv: "2027-02-18", maintenanceStatus: "In Werkstatt", activeDriver: null, activeSince: null },
  { plate: "SN-BF 122", type: "Wechselbrücke 7,5t", year: 2023, mileage: 98230, nextService: "2026-11-12", nextTuv: "2027-04-02", maintenanceStatus: "Einsatzbereit", activeDriver: null, activeSince: null },
];

export const initialOrders: OrderRecord[] = [
  { id: "BF-48213", customer: "Rathke Baustoffe GmbH", pickup: "Falkenwalde", delivery: "Berlin", date: "2026-09-02", notes: "", status: "Unterwegs", driverName: "Lukas Schmidt", vehiclePlate: "SN-BF 101", createdAt: "2026-09-01T08:00:00.000Z", messages: [] },
  { id: "BF-48214", customer: "Nordbalt Trading Sp. z o.o.", pickup: "Falkenwalde", delivery: "Danzig (PL)", date: "2026-09-02", notes: "", status: "Disponiert", driverName: "Piotr Nowak", vehiclePlate: "SN-BF 104", createdAt: "2026-09-01T08:10:00.000Z", messages: [] },
  { id: "BF-48215", customer: "Küstenlogistik Nord", pickup: "Falkenwalde", delivery: "Hamburg", date: "2026-09-03", notes: "", status: "Neu", driverName: null, vehiclePlate: null, createdAt: "2026-09-01T09:00:00.000Z", messages: [] },
  { id: "BF-48216", customer: "Berndt Frischwaren", pickup: "Falkenwalde", delivery: "Rostock", date: "2026-09-02", notes: "Kühltransport, -4 °C", status: "Zugestellt", driverName: "Timo Fischer", vehiclePlate: "SN-BF 112", createdAt: "2026-08-31T07:00:00.000Z", messages: [] },
  { id: "BF-48217", customer: "AgroTrans Pommern", pickup: "Stettin (PL)", delivery: "Falkenwalde", date: "2026-09-03", notes: "", status: "Neu", driverName: null, vehiclePlate: null, createdAt: "2026-09-01T10:00:00.000Z", messages: [] },
];
