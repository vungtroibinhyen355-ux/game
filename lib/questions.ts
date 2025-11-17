export interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

export const questions: Question[] = [
  {
    id: 1,
    question: "Vận tốc được định nghĩa là gì?",
    options: [
      "Quãng đường đi được trong một đơn vị thời gian",
      "Thời gian cần thiết để di chuyển",
      "Khối lượng của một vật",
      "Lực tác dụng lên vật",
    ],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: "Công thức tính vận tốc là gì?",
    options: ["v = s × t", "v = s / t", "v = t / s", "v = s + t"],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "Nếu một chiếc xe đi được 100 km trong 2 giờ, vận tốc của nó là bao nhiêu?",
    options: ["50 km/h", "100 km/h", "200 km/h", "25 km/h"],
    correctAnswer: 0,
  },
  {
    id: 4,
    question: "Đơn vị của vận tốc trong Hệ SI là gì?",
    options: ["m/s", "km/h", "cm/s", "m/h"],
    correctAnswer: 0,
  },
  {
    id: 5,
    question: "Một người chạy 400 m trong 80 giây. Vận tốc của người đó là bao nhiêu?",
    options: ["5 m/s", "20 m/s", "2 m/s", "10 m/s"],
    correctAnswer: 0,
  },
  {
    id: 6,
    question: "Vận tốc trung bình được tính như thế nào?",
    options: [
      "Quãng đường tổng cộng chia cho thời gian tổng cộng",
      "Tốc độ lớn nhất cộng với tốc độ nhỏ nhất",
      "Quãng đường nhân với thời gian",
      "Hiệu vận tốc cuối và vận tốc đầu",
    ],
    correctAnswer: 0,
  },
  {
    id: 7,
    question: "Nếu một tàu thủy chuyển động với vận tốc 20 km/h trong 3 giờ, quãng đường mà nó đi được là bao nhiêu?",
    options: ["60 km", "20 km", "3 km", "23 km"],
    correctAnswer: 0,
  },
  {
    id: 8,
    question: "Sự khác biệt giữa vận tốc và tốc độ là gì?",
    options: [
      "Vận tốc có hướng, tốc độ không có hướng",
      "Vận tốc không có hướng, tốc độ có hướng",
      "Chúng không khác nhau",
      "Vận tốc lớn hơn tốc độ",
    ],
    correctAnswer: 0,
  },
  {
    id: 9,
    question: "Chuyển đổi 72 km/h thành m/s: kết quả là bao nhiêu?",
    options: ["20 m/s", "30 m/s", "10 m/s", "50 m/s"],
    correctAnswer: 0,
  },
  {
    id: 10,
    question:
      "Một đoàn tàu chạy 300 km trong thời gian từ 10:00 sáng đến 14:00 chiều (cùng ngày). Vận tốc trung bình của tàu là bao nhiêu?",
    options: ["75 km/h", "150 km/h", "60 km/h", "50 km/h"],
    correctAnswer: 0,
  },
]
