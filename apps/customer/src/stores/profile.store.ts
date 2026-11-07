import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerProfile {
  name: string;
  email?: string;
  phone?: string;
  diningNotes?: string;
  vegetarianOnly?: boolean;
  emailOffers?: boolean;
}

interface ProfileState {
  profile: CustomerProfile | null;
  savedProfile: boolean;
  setProfile: (profile: CustomerProfile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      savedProfile: false,
      setProfile: (profile) => set({ profile, savedProfile: true }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'resto-profile-v1',
      partialize: (state) => ({ profile: state.profile, savedProfile: state.savedProfile }),
    },
  ),
);
