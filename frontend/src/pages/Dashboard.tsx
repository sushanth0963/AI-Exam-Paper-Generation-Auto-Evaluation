import { useEffect, useState } from "react";
import { getProfile } from "../api/client";

function Dashboard() {

    const [user, setUser] = useState("");

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                if (!localStorage.getItem("token")) {

                    alert("Please Login First");

                    window.location.href = "/";

                    return;
                }

                const response = await getProfile();

                console.log(response.data);

                setUser(response.data.user.sub);

            } catch (error) {

                console.log(error);

                alert("Session Expired");

                localStorage.removeItem("token");

                window.location.href = "/";
            }
        };

        fetchProfile();

    }, []);

    const logout = () => {

        localStorage.removeItem("token");

        alert("Logged Out");

        window.location.href = "/";
    };

    return (

        <div
            style={{
                padding: "40px"
            }}
        >

            <h1>AI Exam Platform Dashboard</h1>

            <h2>Welcome {user}</h2>

            <button
                onClick={logout}
                style={{
                    padding: "10px",
                    marginTop: "20px"
                }}
            >
                Logout
            </button>

        </div>
    );
}

export default Dashboard;