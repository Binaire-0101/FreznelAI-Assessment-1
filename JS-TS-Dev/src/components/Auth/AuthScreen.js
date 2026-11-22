import blessed from "blessed";
import {
    getAuthErrorMessage,
    registerWithEmail,
    signInWithEmail
} from "../../auth/firebaseAuth.js";
import { getFirebaseAuth } from "../../config/firebase.js";

class AuthScreen {
    constructor() {
        this.screen = blessed.screen({
            smartCSR: true,
            title: "System Monitor Authentication",
            input: process.stdin,
            output: process.stdout
        });

        this.menu = blessed.list({
            parent: this.screen,
            top: "center",
            left: "center",
            width: "60%",
            height: 9,
            label: " System Monitor ",
            border: { type: "line", fg: "cyan" },
            items: ["Sign in", "Create account", "Exit"],
            keys: true,
            vi: true,
            mouse: true,
            style: {
                selected: { fg: "white", bg: "blue" },
                item: { fg: "white" }
            }
        });

        this.statusBox = blessed.box({
            parent: this.screen,
            bottom: 1,
            left: "center",
            width: "80%",
            height: 3,
            content: "Choose Sign in or Create account. Use Up/Down and Enter.",
            align: "center",
            valign: "middle",
            tags: false
        });

        this.resolved = false;
        this.busy = false;
    }

    start() {
        getFirebaseAuth();

        return new Promise((resolve) => {
            this.resolve = resolve;
            this.menu.on("select", (item, index) => {
                void this.handleChoice(index);
            });
            this.screen.key(["C-c"], () => {
                if (!this.busy) this.finish(null);
            });
            this.menu.key(["q"], () => this.finish(null));
            this.menu.focus();
            this.screen.render();
        });
    }

    async handleChoice(index) {
        if (this.busy) return;

        if (index === 2) {
            this.finish(null);
            return;
        }

        this.busy = true;
        const isRegistration = index === 1;
        const credentials = await this.promptForCredentials(isRegistration);

        if (!credentials) {
            this.busy = false;
            this.returnToMenu("Authentication cancelled.");
            return;
        }

        this.statusBox.setContent(
            isRegistration ? "Creating account..." : "Signing in..."
        );
        this.screen.render();

        try {
            const user = isRegistration
                ? await registerWithEmail(credentials.email, credentials.password)
                : await signInWithEmail(credentials.email, credentials.password);
            this.finish(user);
        } catch (error) {
            this.busy = false;
            this.returnToMenu(
                `${isRegistration ? "Sign-up" : "Sign-in"} failed: ${getAuthErrorMessage(error)}`
            );
        }
    }

    promptForCredentials(isRegistration) {
        return new Promise((resolve) => {
            this.menu.hide();

            const dialog = blessed.box({
                parent: this.screen,
                top: "center",
                left: "center",
                width: "70%",
                height: 14,
                label: isRegistration ? " Create account " : " Sign in ",
                border: { type: "line", fg: "cyan" },
                content:
                    "Enter email and password. Tab switches fields. Enter signs in. Esc cancels."
            });

            const emailInput = blessed.textbox({
                parent: dialog,
                top: 4,
                left: 2,
                right: 2,
                height: 3,
                label: " Email ",
                inputOnFocus: true,
                keys: true,
                mouse: true,
                border: { type: "line" }
            });

            const passwordInput = blessed.textbox({
                parent: dialog,
                top: 8,
                left: 2,
                right: 2,
                height: 3,
                label: " Password ",
                inputOnFocus: true,
                keys: true,
                mouse: true,
                censor: "*",
                border: { type: "line" }
            });

            let completed = false;
            const complete = (value) => {
                if (completed) return;
                completed = true;
                emailInput.cancel();
                passwordInput.cancel();
                dialog.destroy();
                this.menu.show();
                this.screen.render();
                resolve(value);
            };

            const submit = () => {
                const email = String(emailInput.getValue() || "").trim();
                const password = String(passwordInput.getValue() || "");

                if (!email) {
                    this.statusBox.setContent("Enter an email address.");
                    emailInput.focus();
                    this.screen.render();
                    return;
                }

                if (!password) {
                    this.statusBox.setContent("Enter a password.");
                    passwordInput.focus();
                    this.screen.render();
                    return;
                }

                complete({ email, password });
            };

            const bindNavigation = (input, onEnter) => {
                input.on("submit", onEnter);
                input.on("cancel", () => complete(null));
                input.on("keypress", (_character, key) => {
                    if (!key) return;

                    if (key.name === "escape") {
                        complete(null);
                        return;
                    }

                    if (key.name === "tab") {
                        if (input === emailInput) passwordInput.focus();
                        else emailInput.focus();
                        this.screen.render();
                    }
                });
            };

            bindNavigation(emailInput, () => {
                passwordInput.focus();
                this.screen.render();
            });
            bindNavigation(passwordInput, submit);

            this.statusBox.setContent("Enter your email, then password, then press Enter.");
            emailInput.focus();
            this.screen.render();
        });
    }

    returnToMenu(message) {
        this.statusBox.setContent(message);
        this.menu.show();
        this.menu.focus();
        this.screen.render();
    }

    finish(user) {
        if (this.resolved) return;
        this.resolved = true;
        this.screen.destroy();
        if (typeof process.stdin.resume === "function") {
            process.stdin.resume();
        }
        this.resolve(user);
    }
}

export default AuthScreen;
