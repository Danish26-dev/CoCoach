# CoCoach - Real-Time Athletic Performance Coach

### Overview
CoCoach is an AI-powered web application designed to enhance athletic performance across multiple sports. It leverages computer vision and real-time feedback to help users improve form and technique. The application features user authentication, workout history tracking, advanced pose detection, 3D visualization, and voice-guided coaching. Originally developed for golf, CoCoach has expanded to include a comprehensive general fitness module, advanced analytics for performance tracking, and emotional support features to provide a holistic coaching experience.

### User Preferences
No specific user preferences were provided in the original `replit.md` file.

### System Architecture
**UI/UX Decisions:**
The application utilizes a modern design system with the Inter font family, professional cards, improved forms, and modern inputs. Styling is handled with TailwindCSS, and a consistent, cohesive modern design is maintained across all pages. The dashboard features a modern sidebar with backdrop blur and professional navigation elements.

**Technical Implementations:**
-   **Backend:** Built with Flask, providing REST API endpoints for authentication, user management, and workout tracking. It uses Flask-SQLAlchemy for ORM, Flask-Login for session management, and Bcrypt for secure password hashing.
-   **Frontend:** Primarily uses Vanilla JavaScript, HTML, and CSS. It integrates several CDN-based libraries for key functionalities, ensuring a lean client-side without a complex build process.
-   **Pose Detection:** Employs MediaPipe Pose for real-time skeletal tracking and exercise-specific analysis.
-   **3D Visualization:** Utilizes Three.js for rendering a 3D avatar that mirrors user movements in real-time, enhanced by Kalidokit for MediaPipe to Three.js pose retargeting.
-   **Voice Coaching:** Implemented using the Web Speech API for real-time vocal feedback and emotional support.

**Feature Specifications:**
-   **Authentication & User Management:** Secure signup/login, session-based authentication, protected API endpoints.
-   **General Fitness Module:** Features five core exercises (Squats, Push-ups, Lunges, Plank, Jumping Jacks) with real-time, exercise-specific analysis, rep counting, duration tracking, and voice coaching. Includes 3D avatar pose mirroring.
-   **Golf Training:** Offers live posture feedback with specialized drills like Wall-Back Alignment, Hip Twist, Air Swing, and an enhanced Shoulder Level drill with comprehensive posture analysis.
-   **Data Persistence:** Tracks workout history including exercise type, sport category, duration, reps, and detailed metrics, saved to a database.
-   **Advanced Analytics (AdFi & ProEm):**
    -   **AdFi:** Provides real-time workout streak calculation, weekly/monthly performance trends, old vs. new performance comparisons, percentage improvement/decline metrics, and adaptive recommendations. Uses Chart.js for visualizations.
    -   **ProEm (Elite Performance Features):** 
        - **Form Quality Score (0-100):** Real-time calculation from workout completion, volume, and consistency with color-coded badges (Elite: 90+, Advanced: 75-89, Developing: <75)
        - **Injury Risk Alerts:** Automatic warnings when form quality drops below 75% with contextual coaching tips
        - **Elite Athlete Metrics:** Power Output (W), Movement Efficiency (%), Recovery Index (0-10), Consistency Score (%)
        - **Performance Forecasting:** AI-driven predictions with Chart.js trajectory visualization, confidence percentages
        - **Enhanced Voice AI:** Contextual responses based on real metrics (form quality, power output, recovery, streak)
        - **Consecutive Streak Tracking:** True consecutive-day calculation from workout history
        - **Real-time Trend Analysis:** All trends calculated from last 7 vs previous 7 days (no placeholder data)
-   **3D Visualization:** Interactive 3D coach avatar with customizable poses, outfit colors, skin tones, and energy levels.

**System Design Choices:**
-   **Backend Architecture:** Flask REST API with PostgreSQL as the primary database (SQLite fallback). Session-based authentication with secure password hashing.
-   **Frontend Architecture:** CDN-dependent, no build process, uses Fetch API for backend communication.
-   **Database Schema:** `Users` table (id, username, email, password_hash, created_at) and `WorkoutHistory` table (id, user_id, exercise_type, sport_category, duration_seconds, reps_count, metrics (JSON), timestamp).
-   **Deployment:** Configured for Replit with port 5000 and host 0.0.0.0; features automatic database setup.

### External Dependencies
-   **Flask**: Python web framework.
-   **Flask-SQLAlchemy**: ORM for database interactions.
-   **Flask-Login**: User session management.
-   **PostgreSQL**: Primary relational database (with SQLite fallback).
-   **Bcrypt**: Password hashing library.
-   **MediaPipe Pose (CDN)**: Real-time pose detection.
-   **Three.js (CDN)**: 3D graphics library for avatar rendering.
-   **Kalidokit (CDN)**: MediaPipe to Three.js pose retargeting.
-   **TailwindCSS (CDN)**: Utility-first CSS framework.
-   **Web Speech API**: Browser API for speech synthesis and recognition.
-   **Chart.js**: JavaScript charting library for data visualization.