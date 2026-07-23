import { lazy, Suspense, useEffect } from 'react'
import {
    BrowserRouter,
    Route,
    Routes,
} from 'react-router-dom'
import { Toaster } from 'sonner'

import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ProfileOnboardingGate from './components/ProfileOnboardingGate'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './store/useAuthStore'
import { ThemeProvider } from './contexts/ThemeContext'

const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Workouts = lazy(() => import('./pages/Workouts'))
const WorkoutDetail = lazy(() => import('./pages/WorkoutDetail'))
const Nutrition = lazy(() => import('./pages/Nutrition'))
const Progress = lazy(() => import('./pages/Progress'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Trainers = lazy(() => import('./pages/Trainers'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Memberships = lazy(() => import('./pages/Memberships'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Admin = lazy(() => import('./pages/Admin'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const TrainerWorkouts = lazy(() => import('./pages/TrainerWorkouts'))
const TrainerProfile = lazy(() => import('./pages/TrainerProfile'))
const TrainerSessions = lazy(() => import('./pages/TrainerSessions'))
const ExerciseManagement = lazy(() => import('./pages/ExerciseManagement'))
const FoodManagement = lazy(() => import('./pages/FoodManagement'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
    <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
)

const AppRoutes = () => {
    const token = useAuthStore((state) => state.token)
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser)

    useEffect(() => {
        if (!token && !isAuthenticated) {
            return
        }

        void fetchCurrentUser()
    }, [fetchCurrentUser, isAuthenticated, token])

    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<ProfileOnboardingGate />}>
                    <Route element={<MainLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/onboarding" element={<Onboarding />} />
                        </Route>
                        <Route path="/trainers" element={<Trainers />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                            <Route path="/workouts" element={<Workouts />} />
                            <Route path="/workouts/:id" element={<WorkoutDetail />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['CLIENT', 'TRAINER']} />}>
                            <Route path="/sessions" element={<Sessions />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['TRAINER']} />}>
                            <Route path="/trainer-workouts" element={<TrainerWorkouts />} />
                            <Route path="/trainer-profile" element={<TrainerProfile />} />
                            <Route path="/trainer-sessions" element={<TrainerSessions />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                            <Route path="/nutrition" element={<Nutrition />} />
                            <Route path="/progress" element={<Progress />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                            <Route path="/memberships" element={<Memberships />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']} />}>
                            <Route path="/analytics" element={<Analytics />} />
                        </Route>
                    </Route>
                    </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route element={<MainLayout />}>
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/exercises" element={<ExerciseManagement />} />
                        <Route path="/admin/foods" element={<FoodManagement />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    )
}

const App = () => {
    return (
        <ThemeProvider>
            <ErrorBoundary>
                <BrowserRouter>
                    <AppRoutes />
                    <Toaster
                        position="bottom-right"
                        expand={false}
                        richColors
                        closeButton
                    />
                </BrowserRouter>
            </ErrorBoundary>
        </ThemeProvider>
    )
}

export default App
