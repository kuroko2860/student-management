import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import StudentDialog from "@/components/StudentDialog";

import { getStudents, deleteStudent } from "@/services/student.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Students() {
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);

      const data = await getStudents();

      setStudents(data);
    } catch (err) {
      console.error(err);

      toast.error("Không thể tải danh sách học sinh");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setSelectedStudent(null);

    setDialogOpen(true);
  }

  function handleEdit(student) {
    setSelectedStudent(student);

    setDialogOpen(true);
  }

  async function handleDelete(student) {
    const ok = window.confirm(`Xóa học sinh "${student.name}" ?`);

    if (!ok) return;

    try {
      await deleteStudent(student.id);

      toast.success("Đã xóa học sinh");

      loadStudents();
    } catch (err) {
      console.error(err);

      toast.error("Không thể xóa học sinh");
    }
  }

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;

    const keyword = search.toLowerCase();

    return students.filter((student) => {
      return (
        student.name?.toLowerCase().includes(keyword) ||
        student.phone?.toLowerCase().includes(keyword) ||
        student.parent_name?.toLowerCase().includes(keyword) ||
        student.classes?.name?.toLowerCase().includes(keyword)
      );
    });
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Học sinh</h1>

          <p className="text-sm text-muted-foreground">
            Quản lý danh sách học sinh
          </p>
        </div>

        <Button onClick={handleAdd}>+ Thêm học sinh</Button>
      </div>

      <Input
        placeholder="Tìm theo tên, lớp, SĐT..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Học sinh</th>

              <th className="p-3 text-left">Lớp</th>

              <th className="p-3 text-left">SĐT</th>

              <th className="p-3 text-left">Phụ huynh</th>

              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  Đang tải...
                </td>
              </tr>
            )}

            {!loading && filteredStudents.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  Không có học sinh
                </td>
              </tr>
            )}

            {!loading &&
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="p-3 font-medium">{student.name}</td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: student.classes?.color ?? "#3B82F6",
                        }}
                      />

                      {student.classes?.name ?? "-"}
                    </div>
                  </td>

                  <td className="p-3">{student.phone || "-"}</td>

                  <td className="p-3">
                    <div>
                      <div>{student.parent_name || "-"}</div>

                      <div className="text-xs text-muted-foreground">
                        {student.parent_phone}
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(student)}
                      >
                        Sửa
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(student)}
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

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedStudent={selectedStudent}
        onSuccess={loadStudents}
      />
    </div>
  );
}
