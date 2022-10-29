import Link from "next/link";

const NavLink = ({ to, name }: { to: string; name: string }) => {
  return (
    <Link href={to}>
      <div className="transition px-2 py-1 rounded hoverable">{name}</div>
    </Link>
  );
};

export default function Nav() {
  return (
    <nav className="container mx-auto px-4 py-4 flex">
      <div className="flex-1 font-bold mr-4">Deel Mock App</div>
      <div className="flex gap-2">
        <NavLink to="/profile" name="Profile" />
        <NavLink to="/admin" name="Admin" />
        <NavLink to="/contracts" name="Contracts" />
        <NavLink to="/jobs" name="Jobs" />
      </div>
    </nav>
  );
}
