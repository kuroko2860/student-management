import { useEffect } from "react";
import { getClasses } from "@/services/class.service";

export default function Test() {
    useEffect(() => {
        async function load() {
            try {
                const data = await getClasses();
                console.log(data);
            } catch (err) {
                console.error(err);
            }
        }

        load();
    }, []);

    return <div>Test Supabase</div>;
}