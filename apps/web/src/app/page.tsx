export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        background:
          "linear-gradient(135deg,#f5f9ff,#ffffff)",
      }}
    >
      <h1
        style={{
          fontSize: "64px",
          fontWeight: 700,
        }}
      >
        NEIGHBOUR™
      </h1>

      <p
        style={{
          fontSize: "24px",
          marginTop: "20px",
        }}
      >
        Welcome home.
      </p>

      <p
        style={{
          marginTop: "10px",
          fontSize: "18px",
        }}
      >
        Connect with the people around you.
      </p>

      <div style={{ marginTop: "40px" }}>
        <button>
          Create Account
        </button>

        <button style={{ marginLeft: "20px" }}>
          Sign In
        </button>
      </div>
    </main>
  );
}
