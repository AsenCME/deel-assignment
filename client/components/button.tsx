export default function Button({
  title,
  onClick = () => {},
}: {
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="px-4 py-2 rounded bg-gray-300 hover:bg-black text-gray-700 hover:text-gray-100 transition"
      onClick={onClick}
    >
      {title}
    </button>
  );
}
