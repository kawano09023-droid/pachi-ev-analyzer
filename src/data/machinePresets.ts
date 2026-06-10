export type MachinePreset = {
  name: string;
  probability: number;
  borderRotation: number;
  averagePayout?: number;
  category?: "pachinko" | "smart-pachinko" | "pachislot";
  note?: string;
};

const referenceNote = "参考値です。公式値ではなく、交換率・出玉削り・持ち玉比率・店舗条件で変動します。";

export const machinePresets: MachinePreset[] = [
  {
    name: "P エヴァンゲリオン15",
    probability: 319,
    borderRotation: 17.0,
    averagePayout: 4500,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "P Re:ゼロから始める異世界生活 鬼がかりver.",
    probability: 319,
    borderRotation: 16.5,
    averagePayout: 5000,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "P 大海物語5",
    probability: 319,
    borderRotation: 18.0,
    averagePayout: 4200,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "e 東京喰種",
    probability: 399,
    borderRotation: 16.0,
    averagePayout: 7900,
    category: "smart-pachinko",
    note: referenceNote,
  },
  {
    name: "e 北斗の拳10",
    probability: 349,
    borderRotation: 16.5,
    averagePayout: 6500,
    category: "smart-pachinko",
    note: referenceNote,
  },
  {
    name: "P とある科学の超電磁砲2",
    probability: 319,
    borderRotation: 17.5,
    averagePayout: 4800,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "P 魔法少女まどか☆マギカ3",
    probability: 319,
    borderRotation: 17.0,
    averagePayout: 4700,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "e ソードアート・オンライン",
    probability: 319,
    borderRotation: 16.8,
    averagePayout: 5200,
    category: "smart-pachinko",
    note: referenceNote,
  },
  {
    name: "P 炎炎ノ消防隊",
    probability: 319,
    borderRotation: 17.2,
    averagePayout: 4600,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "P シン・エヴァンゲリオン",
    probability: 319,
    borderRotation: 17.0,
    averagePayout: 4550,
    category: "pachinko",
    note: referenceNote,
  },
  {
    name: "e 花の慶次",
    probability: 349,
    borderRotation: 16.8,
    averagePayout: 6200,
    category: "smart-pachinko",
    note: referenceNote,
  },
];
