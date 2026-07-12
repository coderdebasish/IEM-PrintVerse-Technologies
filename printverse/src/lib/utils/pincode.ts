export interface PincodeResult {
  valid: boolean;
  officeName?: string;
  district?: string;
  state?: string;
  error?: string;
}

/**
 * Validates an Indian pincode using the free India Post API.
 * Returns district/state for auto-fill if valid.
 * Soft-fails on API errors so checkout is not permanently blocked.
 */
export async function validatePincode(pincode: string): Promise<PincodeResult> {
  if (!/^\d{6}$/.test(pincode)) {
    return { valid: false, error: "Pincode must be exactly 6 digits." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        valid: false,
        error: "Unable to verify pincode right now. Please check and retry.",
      };
    }

    const data = await res.json();

    if (!Array.isArray(data) || data[0]?.Status !== "Success") {
      return { valid: false, error: "Invalid pincode. Please check and try again." };
    }

    const post = data[0].PostOffice?.[0];
    if (!post) {
      return { valid: false, error: "No post office found for this pincode." };
    }

    return {
      valid: true,
      officeName: post.Name,
      district: post.District,
      state: post.State,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      valid: false,
      error: isAbort
        ? "Pincode verification timed out. You may proceed — we'll confirm delivery."
        : "Unable to verify pincode right now. You may proceed — we'll confirm delivery.",
    };
  }
}
