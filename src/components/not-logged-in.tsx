import LoginBtn from "~/components/login-btn";

const NotLoggedIn = () => {
  return (
    <div>
      Login to track your tips and view stats like average $ per hour
      <LoginBtn />
    </div>
  );
};

export default NotLoggedIn;
