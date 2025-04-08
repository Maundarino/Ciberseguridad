import React, { useState, useEffect } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";

interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}

interface ValidationErrors {
  usernameOrEmail?: string;
  password?: string;
}

function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    usernameOrEmail: "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success" | "warning";
  }>({
    text: "",
    type: "error",
  });
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Recuperar intentos de inicio de sesión del localStorage
  useEffect(() => {
    const storedAttempts = localStorage.getItem("loginAttempts");
    const lockoutTime = localStorage.getItem("lockoutTime");

    if (storedAttempts && lockoutTime) {
      const attempts = parseInt(storedAttempts);
      const lockExpiration = parseInt(lockoutTime);

      if (Date.now() < lockExpiration) {
        setLoginAttempts(attempts);
        setIsLocked(true);
      } else {
        // Resetear si el tiempo de bloqueo ha expirado
        localStorage.removeItem("loginAttempts");
        localStorage.removeItem("lockoutTime");
      }
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validar username/email
    if (!formData.usernameOrEmail) {
      newErrors.usernameOrEmail = "Este campo es requerido";
      isValid = false;
    } else if (formData.usernameOrEmail.includes("@")) {
      // Validación de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.usernameOrEmail)) {
        newErrors.usernameOrEmail = "Formato de correo electrónico inválido";
        isValid = false;
      }
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "Este campo es requerido";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleForgotPassword = () => {
    navigate("/recover-password");
  };

  const handleLockout = () => {
    setIsLocked(true);
    const lockoutDuration = 15 * 60 * 1000; // 15 minutos en milisegundos
    localStorage.setItem("loginAttempts", loginAttempts.toString());
    localStorage.setItem(
      "lockoutTime",
      (Date.now() + lockoutDuration).toString()
    );

    setTimeout(() => {
      setIsLocked(false);
      setLoginAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockoutTime");
    }, lockoutDuration);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isLocked) {
      setMessage({
        text: "Tu cuenta está temporalmente bloqueada. Por favor, intenta más tarde o recupera tu contraseña.",
        type: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
        mode: "cors", // Explícitamente establecemos el modo CORS
      });

      // Para debugging
      console.log("Response headers:", {
        "access-control-allow-origin": response.headers.get(
          "access-control-allow-origin"
        ),
        "content-type": response.headers.get("content-type"),
      });

      const data = await response.json().catch((e) => {
        console.error("Error parsing JSON:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      });

      if (!response.ok) {
        const data = await response.json();

        // Manejar diferentes tipos de errores
        switch (data.error) {
          case "USER_NOT_FOUND":
            throw new Error(
              "No existe una cuenta con este usuario o correo electrónico"
            );
          case "INVALID_PASSWORD":
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            throw new Error(
              `Contraseña incorrecta. Te quedan ${3 - newAttempts} intentos`
            );
          case "ACCOUNT_LOCKED":
            handleLockout();
            throw new Error("Tu cuenta ha sido bloqueada temporalmente");
          default:
            throw new Error(data.message || "Error en el inicio de sesión");
        }
      }

      // Guardar el token y redirigir
      localStorage.setItem("token", data.token);
      setMessage({
        text: "¡Inicio de sesión exitoso!",
        type: "success",
      });

      // Resetear intentos de login
      setLoginAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockoutTime");

      // Redirigir después de un breve delay
      setTimeout(() => navigate("/menu"), 1000);
    } catch (error) {
      if (error instanceof Error) {
        setMessage({
          text: error.message,
          type: "error",
        });
      } else {
        setMessage({
          text: "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.",
          type: "error",
        });
      }

      // Si hay demasiados intentos, bloquear la cuenta
      if (loginAttempts >= 2) {
        handleLockout();
        setMessage({
          text: "Has excedido el número de intentos. Tu cuenta ha sido bloqueada por 15 minutos.",
          type: "warning",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="font-CreamBeige text-6xl text-violet-950">LOGUS</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="usernameOrEmail"
              className="block text-xl font-Marykate text-gray-700"
            >
              Usuario o correo electrónico
            </label>
            <input
              type="text"
              id="usernameOrEmail"
              name="usernameOrEmail"
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-lg 
                text-sm focus:ring-violet-500 focus:border-violet-500 
                ${
                  errors.usernameOrEmail ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="username o user@email.com"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              disabled={isLocked || isLoading}
            />
            {errors.usernameOrEmail && (
              <p className="mt-1 text-sm text-red-600">
                {errors.usernameOrEmail}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xl font-Marykate text-gray-700"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border rounded-lg 
                text-sm focus:ring-violet-500 focus:border-violet-500
                ${errors.password ? "border-red-500" : "border-gray-300"}`}
              placeholder="•••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLocked || isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/register"
              className="text-sm text-violet-600 hover:text-violet-500"
            >
              ¿No tienes una cuenta? Regístrate
            </Link>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-violet-600 hover:text-violet-500"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLocked || isLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-lg
              text-white font-CreamBeige text-lg 
              ${
                isLocked || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-violet-950 hover:bg-violet-800 focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              }`}
          >
            {isLoading ? (
              <span className="inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {message.text && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : message.type === "warning"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
            {isLocked && (
              <button
                onClick={handleForgotPassword}
                className="ml-2 underline hover:no-underline"
              >
                Recuperar contraseña
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;