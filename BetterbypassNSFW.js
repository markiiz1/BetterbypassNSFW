/**
 * @name BypassNSFW
 * @author Markiiz
 * @description Lets you bypass NSFW/18+ channels.
 * @version 1
 */

module.exports = class BypassNSFW {
    start() {
        this.patchNSFWCheck();
    }

    stop() {
        BdApi.Patcher.unpatchAll("BypassNSFW");
    }

    patchNSFWCheck() {
        const { Webpack, Patcher } = BdApi;

        // User Store
        const UserStore = Webpack.getByKeys("getCurrentUser");

        if (UserStore?.getCurrentUser) {
            Patcher.after("BypassNSFW", UserStore, "getCurrentUser", (_, __, user) => {
                if (!user) return;

                user.nsfwAllowed = true;
                user.ageVerified = true;
                user.ageGateBypass = true;
                if ("age" in user) user.age = 21;
            });
        }

        // Force on current user immediately
        const currentUser = UserStore?.getCurrentUser?.();
        if (currentUser) {
            currentUser.nsfwAllowed = true;
            currentUser.ageVerified = true;
            currentUser.ageGateBypass = true;
        }

        // NSFW Check Modules
        const isNSFWFilter = (m) => typeof m?.isNSFW === "function" || typeof m?.default?.isNSFW === "function";

        const NSFWModules = [
            Webpack.getModule(isNSFWFilter),
            Webpack.getByKeys("isNSFW"),
            Webpack.getByKeys("shouldShowNSFWWarning")
        ];

        NSFWModules.forEach(mod => {
            if (!mod) return;

            if (typeof mod.isNSFW === "function") {
                Patcher.instead("BypassNSFW", mod, "isNSFW", () => false);
            }
            if (mod.default && typeof mod.default.isNSFW === "function") {
                Patcher.instead("BypassNSFW", mod.default, "isNSFW", () => false);
            }
        });

        console.log("%c[BypassNSFW] %cSuccessfully loaded and patched!", "color: #ff00ff; font-weight: bold", "color: lime");
    }
};
