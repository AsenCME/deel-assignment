export default function Category({
  name,
  isSelected,
  onClick,
}: {
  name: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-full cursor-pointer px-4 py-1 ${
        isSelected ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600"
      } font-bold text-sm`}
    >
      {name}
    </div>
  );
}
