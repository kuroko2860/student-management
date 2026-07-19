import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
    getClasses,
    deleteClass,
} from "@/services/class.service";

import ClassDialog from "@/components/ClassDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);

    const [selectedClass, setSelectedClass] = useState(null);

    async function loadClasses() {
        try {
            setLoading(true);

            const data = await getClasses();

            setClasses(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadClasses();
    }, []);

    async function handleDelete(item) {
        const ok = window.confirm(
            `Xóa lớp "${item.name}" ?`
        );

        if (!ok) return;

        try {
            await deleteClass(item.id);

            toast.success("Đã xóa");

            loadClasses();
        } catch (err) {
            toast.error(err.message);
        }
    }

    function handleAdd() {
        setSelectedClass(null);

        setDialogOpen(true);
    }

    function handleEdit(item) {
        setSelectedClass(item);

        setDialogOpen(true);
    }

    const filtered = useMemo(() => {
        return classes.filter((item) =>
            item.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [classes, search]);

    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">

                <h1 className="text-2xl font-bold">
                    Quản lý lớp học
                </h1>

                <Button onClick={handleAdd}>
                    + Thêm lớp
                </Button>

            </div>

            <Input
                placeholder="Tìm lớp..."
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
            />

            <div className="rounded-lg border">

                <table className="w-full">

                    <thead>

                        <tr className="border-b bg-muted">

                            <th className="p-3 text-left">
                                Tên lớp
                            </th>

                            <th className="p-3 text-left">
                                Học phí
                            </th>

                            <th className="p-3 text-left">
                                Màu
                            </th>

                            <th className="p-3 text-right">
                                Thao tác
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {loading && (
                            <tr>

                                <td
                                    colSpan="4"
                                    className="p-5 text-center"
                                >
                                    Đang tải...
                                </td>

                            </tr>
                        )}

                        {!loading &&
                            filtered.length === 0 && (
                                <tr>

                                    <td
                                        colSpan="4"
                                        className="p-5 text-center"
                                    >
                                        Không có dữ liệu
                                    </td>

                                </tr>
                            )}

                        {!loading &&
                            filtered.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b"
                                >
                                    <td className="p-3">
                                        {item.name}
                                    </td>

                                    <td className="p-3">
                                        {item.price.toLocaleString()} đ
                                    </td>

                                    <td className="p-3">

                                        <div
                                            className="h-6 w-6 rounded-full border"
                                            style={{
                                                background:
                                                    item.color,
                                            }}
                                        />

                                    </td>

                                    <td className="p-3">

                                        <div className="flex justify-end gap-2">

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleEdit(
                                                        item
                                                    )
                                                }
                                            >
                                                Sửa
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDelete(
                                                        item
                                                    )
                                                }
                                            >
                                                Xóa
                                            </Button>

                                        </div>

                                    </td>

                                </tr>
                            ))}

                    </tbody>

                </table>

            </div>

            <ClassDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                selectedClass={selectedClass}
                onSuccess={loadClasses}
            />

        </div>
    );
}