import { createContext, useContext, useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../lib/firebase"

const ExamContext = createContext({})

export const useExam = () => {
  const context = useContext(ExamContext)
  if (!context) {
    throw new Error("useExam must be used within ExamProvider")
  }
  return context
}

export function ExamProvider({ children }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)

  const createExam = async (examData) => {
    try {
      const docRef = await addDoc(collection(db, "exams"), {
        ...examData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating exam:", error)
      throw error
    }
  }

  const getExamsByClass = async (classId) => {
    try {
      const q = query(collection(db, "exams"), where("classId", "==", classId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error fetching exams:", error)
      return []
    }
  }

  const getExamsByCourse = async (courseId, includeArchived = true) => {
    try {
      const q = query(collection(db, "exams"), where("courseId", "==", courseId))
      const snapshot = await getDocs(q)
      const allExams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      if (!includeArchived) {
        return allExams.filter(exam => !exam.isArchived)
      }
      
      return allExams
    } catch (error) {
      console.error("Error fetching exams:", error)
      return []
    }
  }

  const getActiveExamsByCourse = async (courseId) => {
    try {
      const q = query(collection(db, "exams"), where("courseId", "==", courseId))
      const snapshot = await getDocs(q)
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(exam => !exam.isArchived)
    } catch (error) {
      console.error("Error fetching active exams:", error)
      return []
    }
  }

  const getArchivedExamsByCourse = async (courseId) => {
    try {
      const q = query(collection(db, "exams"), where("courseId", "==", courseId))
      const snapshot = await getDocs(q)
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(exam => exam.isArchived === true)
    } catch (error) {
      console.error("Error fetching archived exams:", error)
      return []
    }
  }

  const getExamById = async (examId) => {
    try {
      const docRef = doc(db, "exams", examId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error("Error fetching exam:", error)
      return null
    }
  }

  const updateExam = async (examId, examData) => {
    try {
      const docRef = doc(db, "exams", examId)
      await updateDoc(docRef, {
        ...examData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating exam:", error)
      throw error
    }
  }

  const deleteExam = async (examId) => {
    try {
      await deleteDoc(doc(db, "exams", examId))
      const questionsQ = query(collection(db, "examQuestions"), where("examId", "==", examId))
      const questionsSnapshot = await getDocs(questionsQ)
      const deletePromises = questionsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error("Error deleting exam:", error)
      throw error
    }
  }

  const addQuestion = async (questionData) => {
    try {
      const docRef = await addDoc(collection(db, "examQuestions"), {
        ...questionData,
        createdAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding question:", error)
      throw error
    }
  }

  const getQuestionsByExam = async (examId) => {
    try {
      const q = query(collection(db, "examQuestions"), where("examId", "==", examId))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error fetching questions:", error)
      return []
    }
  }

  const updateQuestion = async (questionId, questionData) => {
    try {
      const docRef = doc(db, "examQuestions", questionId)
      await updateDoc(docRef, questionData)
    } catch (error) {
      console.error("Error updating question:", error)
      throw error
    }
  }

  const deleteQuestion = async (questionId) => {
    try {
      await deleteDoc(doc(db, "examQuestions", questionId))
    } catch (error) {
      console.error("Error deleting question:", error)
      throw error
    }
  }

  const submitExamResult = async (userId, examId, answers, score, questions) => {
    try {
      const wrongAnswers = questions.filter((q, index) => {
        const userAnswer = answers[q.id]
        return userAnswer !== q.correctAnswer
      }).map(q => ({
        questionId: q.id,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
        userAnswer: answers[q.id],
        options: q.options
      }))

      await addDoc(collection(db, "examResults"), {
        userId,
        examId,
        answers,
        score,
        wrongAnswers,
        totalQuestions: questions.length,
        submittedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error submitting exam result:", error)
      throw error
    }
  }

  const getExamResult = async (userId, examId) => {
    try {
      const q = query(
        collection(db, "examResults"),
        where("userId", "==", userId),
        where("examId", "==", examId)
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      }
      return null
    } catch (error) {
      console.error("Error fetching exam result:", error)
      return null
    }
  }

  const getUserExamResults = async (userId) => {
    try {
      const q = query(
        collection(db, "examResults"),
        where("userId", "==", userId)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error fetching user exam results:", error)
      return []
    }
  }

  const value = {
    exams,
    loading,
    createExam,
    getExamsByClass,
    getExamsByCourse,
    getActiveExamsByCourse,
    getArchivedExamsByCourse,
    getExamById,
    updateExam,
    deleteExam,
    addQuestion,
    getQuestionsByExam,
    updateQuestion,
    deleteQuestion,
    submitExamResult,
    getExamResult,
    getUserExamResults,
  }

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}
