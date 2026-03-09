import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Trophy, RotateCcw, Brain } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questionBank: QuizQuestion[] = [
  { question: 'Apa rukun umroh yang pertama?', options: ['Tawaf', 'Ihram', 'Sa\'i', 'Tahallul'], correct: 1, explanation: 'Ihram adalah rukun pertama umroh, yaitu niat memasuki ibadah umroh dari miqat.' },
  { question: 'Berapa kali putaran tawaf mengelilingi Ka\'bah?', options: ['5 kali', '6 kali', '7 kali', '9 kali'], correct: 2, explanation: 'Tawaf dilakukan sebanyak 7 putaran mengelilingi Ka\'bah.' },
  { question: 'Sa\'i dilakukan antara bukit apa dan apa?', options: ['Arafah dan Mina', 'Shafa dan Marwah', 'Uhud dan Hira', 'Mina dan Muzdalifah'], correct: 1, explanation: 'Sa\'i dilakukan antara bukit Shafa dan Marwah sebanyak 7 kali perjalanan.' },
  { question: 'Apa yang dimaksud dengan tahallul?', options: ['Berdoa di Multazam', 'Mencukur/memotong rambut', 'Minum air zamzam', 'Sholat 2 rakaat'], correct: 1, explanation: 'Tahallul adalah mencukur atau memotong rambut sebagai tanda selesainya ibadah umroh.' },
  { question: 'Dari mana dimulai tawaf?', options: ['Pintu Ka\'bah', 'Hajar Aswad', 'Maqam Ibrahim', 'Hijr Ismail'], correct: 1, explanation: 'Tawaf dimulai dari Hajar Aswad (Batu Hitam) yang terletak di sudut tenggara Ka\'bah.' },
  { question: 'Apa hukum menutup kepala bagi pria saat ihram?', options: ['Sunnah', 'Wajib', 'Haram', 'Makruh'], correct: 2, explanation: 'Pria dilarang (haram) menutup kepala saat dalam keadaan ihram.' },
  { question: 'Sholat sunnah setelah tawaf dilakukan di dekat...', options: ['Hijr Ismail', 'Hajar Aswad', 'Maqam Ibrahim', 'Pintu Ka\'bah'], correct: 2, explanation: 'Setelah tawaf, disunnahkan sholat 2 rakaat di belakang Maqam Ibrahim.' },
  { question: 'Berapa jumlah perjalanan Sa\'i dari Shafa ke Marwah dan sebaliknya?', options: ['5 kali', '6 kali', '7 kali', '14 kali'], correct: 2, explanation: 'Sa\'i dilakukan 7 kali: Shafa→Marwah (1), Marwah→Shafa (2), dst. Berakhir di Marwah.' },
  { question: 'Miqat untuk jamaah dari Indonesia yang naik pesawat biasanya di...', options: ['Madinah', 'Jeddah', 'Yalamlam', 'Qarnul Manazil'], correct: 2, explanation: 'Jamaah Indonesia biasanya berihram dari Yalamlam atau melewati miqat di atas pesawat sebelum Jeddah.' },
  { question: 'Apa yang dibaca saat tawaf melewati Hajar Aswad?', options: ['Subhanallah', 'Bismillahi Allahu Akbar', 'Alhamdulillah', 'La ilaha illallah'], correct: 1, explanation: 'Saat melewati atau menghadap Hajar Aswad, disunnahkan membaca "Bismillahi Allahu Akbar".' },
  { question: 'Pakaian ihram pria terdiri dari berapa lembar kain?', options: ['1 lembar', '2 lembar', '3 lembar', '4 lembar'], correct: 1, explanation: 'Pakaian ihram pria terdiri dari 2 lembar kain putih tanpa jahitan: izar (bawah) dan rida (atas).' },
  { question: 'Apa doa yang dibaca saat antara Rukun Yamani dan Hajar Aswad?', options: ['Doa Qunut', 'Rabbana atina fid-dunya...', 'Doa Iftitah', 'Sholawat Nabi'], correct: 1, explanation: 'Di antara Rukun Yamani dan Hajar Aswad disunnahkan membaca "Rabbana atina fid-dunya hasanah wa fil akhirati hasanah wa qina adzaban-nar."' },
];

const QUIZ_SIZE = 5;
const PASS_SCORE = 4;

const ManasikQuiz = () => {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);

  const questions = useMemo(() => {
    const shuffled = [...questionBank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUIZ_SIZE);
  }, [started]);

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;

  const bestScore = (() => {
    try { return parseInt(localStorage.getItem('manasik_quiz_best') || '0', 10); } catch { return 0; }
  })();

  const handleSelect = (optionIdx: number) => {
    if (selected !== null) return;
    setSelected(optionIdx);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentQ + 1 >= QUIZ_SIZE) {
      const finalScore = newAnswers.filter((a, i) => a === questions[i]?.correct).length;
      if (finalScore > bestScore) {
        localStorage.setItem('manasik_quiz_best', String(finalScore));
      }
      setShowResult(true);
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  const restart = () => {
    setStarted(false);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
    setTimeout(() => setStarted(true), 50);
  };

  if (!started) {
    return (
      <Card className="bg-gradient-to-br from-amber-500/5 to-amber-600/10 border-amber-200 dark:border-amber-800">
        <CardContent className="py-6 px-4 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
            <Brain className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-foreground">Quiz Manasik Umroh</h3>
          <p className="text-xs text-muted-foreground">Uji pengetahuan kamu tentang tata cara umroh. {QUIZ_SIZE} soal, jawab dengan benar {PASS_SCORE}+ untuk mendapat badge!</p>
          {bestScore > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Trophy className="w-3 h-3 mr-1" /> Skor terbaik: {bestScore}/{QUIZ_SIZE}
            </Badge>
          )}
          <Button className="w-full" onClick={() => setStarted(true)}>Mulai Quiz</Button>
        </CardContent>
      </Card>
    );
  }

  if (showResult) {
    const passed = score >= PASS_SCORE;
    return (
      <Card className={passed ? 'bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 border-emerald-200 dark:border-emerald-800' : ''}>
        <CardContent className="py-6 px-4 text-center space-y-3">
          {passed ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-foreground">🎉 Selamat! Kamu Siap Umroh!</h3>
              <Badge className="bg-emerald-600 text-white">Skor: {score}/{QUIZ_SIZE}</Badge>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">Perlu Belajar Lagi</h3>
              <Badge variant="secondary">Skor: {score}/{QUIZ_SIZE}</Badge>
              <p className="text-xs text-muted-foreground">Baca kembali materi manasik dan coba lagi!</p>
            </>
          )}
          <Button variant="outline" className="w-full gap-2" onClick={restart}>
            <RotateCcw className="w-4 h-4" /> Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Soal {currentQ + 1}/{QUIZ_SIZE}</span>
        <Badge variant="outline" className="text-xs">{answers.filter((a, i) => a === questions[i]?.correct).length} benar</Badge>
      </div>
      <Progress value={((currentQ + 1) / QUIZ_SIZE) * 100} className="h-1.5" />

      <motion.div key={currentQ} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="py-4 px-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{q.question}</h4>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === q.correct;
                const showFeedback = selected !== null;
                
                let cls = 'border rounded-lg px-3 py-2.5 text-sm text-left w-full transition-colors ';
                if (showFeedback && isCorrect) cls += 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                else if (showFeedback && isSelected && !isCorrect) cls += 'border-destructive bg-destructive/10 text-destructive';
                else if (isSelected) cls += 'border-primary bg-primary/5';
                else cls += 'border-border hover:border-primary/50';

                return (
                  <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={selected !== null}>
                    <div className="flex items-center gap-2">
                      {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {showFeedback && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {selected !== null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">💡 {q.explanation}</p>
                <Button className="w-full mt-2" size="sm" onClick={handleNext}>
                  {currentQ + 1 >= QUIZ_SIZE ? 'Lihat Hasil' : 'Soal Berikutnya'}
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ManasikQuiz;
