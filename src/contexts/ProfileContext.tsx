import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

import { useUser } from "./UserContext";
import {
    getProfile,
    getOverview,
    updateProfile as apiUpdateProfile,
    updateTeacher as apiUpdateTeacher,
    updateProfilePicture as apiUpdatePicture,
    changeTeacherSubbranches as apiChangeSubbranches,
} from "../CourseApi";

// -------------------------------------------------------
// TYPES
// -------------------------------------------------------
export interface ProfileInfo {
    teacher_id: string;
    name: string | null;
    surname: string | null;
    birth_date: string | null;
    avatar_link: string | null;
    status: string | null;
}

export interface TeacherOverview {
    user_id: string;
    Primary_Branch: string | null;
    Biography: string | null;
    First_Teaching_Year: number | null;
}

export interface ProfileUpdateInput {
    name?: string;
    surname?: string;
    birthdate?: string;
}

export interface TeacherUpdateInput {
    first_teaching_year?: number;
    biography?: string;
    primary_branch?: string;
}

export interface TeacherSubbranchChangeInput {
    added?: string[];
    removed?: string[];
}

// -------------------------------------------------------
// CONTEXT SHAPE
// -------------------------------------------------------
interface ProfileContextType {
    profile: ProfileInfo | null;
    overview: TeacherOverview | null;

    isProfileLoading: boolean;
    needsProfileSetup: boolean;

    refreshProfile: () => Promise<void>;
    updateProfile: (data: ProfileUpdateInput) => Promise<void>;
    updateTeacher: (data: TeacherUpdateInput) => Promise<void>;
    updatePicture: (file: File) => Promise<void>;
    updateSubbranches: (data: TeacherSubbranchChangeInput) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// -------------------------------------------------------
// PROVIDER
// -------------------------------------------------------
export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { session, userInfo } = useUser();
    const [profile, setProfile] = useState<ProfileInfo | null>(null);
    const [overview, setOverview] = useState<TeacherOverview | null>(null);
    const [isProfileLoading, setLoading] = useState(true);

    // -------------------------------------------------------
    // Derived: profile incomplete?
    // -------------------------------------------------------
    const needsProfileSetup =
        !isProfileLoading &&
        (
            !profile?.name ||
            !profile?.surname ||
            !profile?.birth_date ||
            !overview?.Primary_Branch
        );

    // -------------------------------------------------------
    // LOAD PROFILE & OVERVIEW
    // -------------------------------------------------------
    const refreshProfile = useCallback(async () => {

        if (!session?.access_token) {
            return;
        }

        if (!userInfo?.user_id) {
            return;
        }

        setLoading(true);

        try {
            const p = await getProfile(userInfo.user_id);
            const ov = await getOverview(p.teacher_id);

            setProfile(p);
            setOverview(ov);
        } catch (err) {
            console.error("[refreshProfile] Failed", err);
        } finally {
            setLoading(false);
        }
    }, [session, userInfo]);

    // -------------------------------------------------------
    // INITIAL LOAD
    // -------------------------------------------------------
    useEffect(() => {
        if (!session?.access_token) return;
        if (!session?.identifier) return;
        refreshProfile();
    }, [session, refreshProfile]);

    // -------------------------------------------------------
    // MUTATIONS
    // -------------------------------------------------------
    const updateProfile = async (data: ProfileUpdateInput) => {
        await apiUpdateProfile(data);
    };

    const updateTeacher = async (data: TeacherUpdateInput) => {
        await apiUpdateTeacher(data);
    };

    const updatePicture = async (file: File) => {
        await apiUpdatePicture(file);
        await refreshProfile();
    };

    const updateSubbranches = async (data: TeacherSubbranchChangeInput) => {
        await apiChangeSubbranches(data);
        await refreshProfile();
    };

    return (
        <ProfileContext.Provider
            value={{
                profile,
                overview,
                isProfileLoading,
                needsProfileSetup,
                refreshProfile,
                updateProfile,
                updateTeacher,
                updatePicture,
                updateSubbranches,
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
}

// -------------------------------------------------------
// HOOK
// -------------------------------------------------------
export function useProfile() {
    const ctx = useContext(ProfileContext);
    if (!ctx) {
        throw new Error("useProfile must be used inside ProfileProvider");
    }
    return ctx;
}
