import API from "./axios";

export const registerUser = async (data: {
    username: string;
    email: string;
    password: string;
    role: string;
}) => {
    return API.post("/auth/register", data);
};

export const loginUser = async (
    email: string,
    password: string
) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return API.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
};