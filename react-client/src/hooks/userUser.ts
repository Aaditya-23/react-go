export function useUser() {
	const hasSession = localStorage.getItem("auth") ? true : false

	function setSession() {
		localStorage.setItem("auth", "true")
	}

	function destroySession() {
		localStorage.removeItem("auth")
	}

	return {
		hasSession,
		setSession,
		destroySession,
	}
}
