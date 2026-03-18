export default function OrderSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="text-3xl font-bold">Order confirmed!</h1>
      <p className="mt-4 text-neutral-500">
        Thanks for your purchase. You'll receive a confirmation email shortly.
      </p>
      <a
        href="/"
        className="mt-8 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:opacity-90"
      >
        Continue shopping
      </a>
    </div>
  );
}
