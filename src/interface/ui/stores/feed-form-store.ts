import { create } from "zustand";

interface FeedFormState {
  draftUrl: string;
  setDraftUrl: (url: string) => void;
  clear: () => void;
}

// フィード登録フォームの入力だけを保持する最小Zustandストア。
export const useFeedFormStore = create<FeedFormState>((set) => ({
  draftUrl: "",
  setDraftUrl: (url) => set({ draftUrl: url }),
  clear: () => set({ draftUrl: "" }),
}));
