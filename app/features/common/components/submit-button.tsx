import { useIsSubmitting } from "remix-validated-form";

export default function SubmitButton({
  text,
  name,
  value,
  color = "blue",
}: {
  text: string;
  name: string;
  value: string;
  color: "blue" | "red";
}) {
  const isSubmitting = useIsSubmitting();
  const buttonClass = ["rounded", "px-4", "py-2", "text-white"];

  if (color === "blue") {
    buttonClass.push("bg-blue-500");
    buttonClass.push("hover:bg-blue-600");
    buttonClass.push("focus:bg-blue-400");
  } else if (color === "red") {
    buttonClass.push("bg-red-500");
    buttonClass.push("hover:bg-red-600");
    buttonClass.push("focus:bg-red-400");
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        type="submit"
        name={name}
        value={value}
        className={buttonClass.join(" ")}
        disabled={isSubmitting}
      >
        {isSubmitting ? "..." : text}
      </button>
    </div>
  );
}
