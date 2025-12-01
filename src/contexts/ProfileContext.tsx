import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

import { useUser } from "./UserContext";

// API calls
import {
    getProfile,
    getOverview,
    getTeacherApprovals,
    updateProfile as apiUpdateProfile,
    updateTeacher as apiUpdateTeacher,
    updateProfilePicture as apiUpdatePicture,
    changeTeacherSubbranches as apiChangeSubbranches,
    requestTeacherApproval as apiRequestTeacherApproval,
} from "../api/ProfileApi";

// -------------------------------------------------------
// TYPES (TRUE BACKEND-MATCHING)
// -------------------------------------------------------

export interface ProfileInfo {
    teacher_id: string;
    name: string | null;
    surname: string | null;
    birth_date: string | null;
    avatar_link: string | null;
    status: string | null;
}

export interface TeacherProfileEmbedded {
    user_id: string;
    name: string | null;
    surname: string | null;
    birth_date: string | null;
    avatar_link: string | null;
    status: string | null;
}

export interface TeacherSubbranch {
    branch_id: string;
    name: string;
}

export interface TeacherOverview {
    user_id: string;
    Profile: TeacherProfileEmbedded | null;

    Subbranches: TeacherSubbranch[] | null;

    First_Teaching_Year: number | null;
    Avg_score: number | null;
    Review_count: number | null;
    Statu: string | null;
    Primary_Branch: string | null;
    Biography: string | null;
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

export interface TeacherApproval {
    ID: string;
    Teacher_ID: string;
    Statu: "PENDING" | "APPROVED" | "REJECTED";
    Applicant_Comment: string | null;
    Reviewer_ID: string | null;
    Decided_At: string | null;
    Created_At: string;
    Updated_At: string;
}

// -------------------------------------------------------
// CONTEXT
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

    requestTeacherApproval: (comment: string) => Promise<void>;
    teacherApprovals: TeacherApproval[] | null;
    loadTeacherApprovals: (teacherId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// -------------------------------------------------------
// PROVIDER
// -------------------------------------------------------

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { session, userInfo } = useUser();

    const [profile, setProfile] = useState<ProfileInfo | null>(null);
    const [overview, setOverview] = useState<TeacherOverview | null>(null);
    const [teacherApprovals, setTeacherApprovals] = useState<TeacherApproval[] | null>(null);
    const [isProfileLoading, setLoading] = useState(true);

    // -------------------------------------------------------
    // Derived State
    // -------------------------------------------------------
    const needsProfileSetup =
        !isProfileLoading &&
        (
            !profile?.name ||
            !profile?.surname ||
            !profile?.birth_date ||
            !overview?.Primary_Branch
        ); // subbranches are not required for setup

    // -------------------------------------------------------
    // Load Teacher Approvals
    // -------------------------------------------------------
    const loadTeacherApprovals = async (teacherId: string) => {
        try {
            const approvals = await getTeacherApprovals(teacherId);
            setTeacherApprovals(approvals);
        } catch (err) {
            console.error("Failed to load teacher approvals", err);
        }
    };

    // -------------------------------------------------------
    // Refresh Profile
    // -------------------------------------------------------
    const refreshProfile = useCallback(async () => {
        if (!session?.access_token) return;
        if (!userInfo?.user_id) return;

        setLoading(true);
        try {
            const p = await getProfile(userInfo.user_id);
            const ov = await getOverview(p.teacher_id);

            // Ensure arrays are always arrays
            if (!ov.Subbranches) ov.Subbranches = [];

            setProfile(p);
            setOverview(ov);

            await loadTeacherApprovals(p.teacher_id);
        } catch (err) {
            console.error("[refreshProfile] Failed:", err);
        } finally {
            setLoading(false);
        }
    }, [session, userInfo]);

    // -------------------------------------------------------
    // Initial Load
    // -------------------------------------------------------
    useEffect(() => {
        if (!session?.access_token) return;
        refreshProfile();
    }, [session, refreshProfile]);

    // -------------------------------------------------------
    // Mutations
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

    const requestTeacherApproval = async (comment: string) => {
        await apiRequestTeacherApproval(comment);

        if (profile?.teacher_id) {
            await loadTeacherApprovals(profile.teacher_id);
        }
    };

    // -------------------------------------------------------
    // PROVIDER VALUE
    // -------------------------------------------------------
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

                requestTeacherApproval,
                teacherApprovals,
                loadTeacherApprovals,
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
}

// -------------------------------------------------------
// Hook
// -------------------------------------------------------
export function useProfile() {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
    return ctx;
}
