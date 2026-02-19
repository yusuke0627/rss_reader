import { create } from "zustand";

interface FeedFormState {
  draftUrl: string;
  setDraftUrl: (url: string) => void;
  clear: () => void;
}

export const useFeedFormStore = create<FeedFormState>((set) => ({
  draftUrl: "",
  setDraftUrl: (url) => set({ draftUrl: url }),
  clear: () => set({ draftUrl: "" }),
}));
